import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';
import { MessageAttachment } from './schemas/message-attachment.schema';
import { User } from '../users/user.schema';
import { StudentProfile } from '../students/student-profile.schema';
import { AuditLogService, AuditActor } from '../audit/audit-log.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(MessageAttachment.name)
    private readonly attachmentModel: Model<MessageAttachment>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfile>,
    private readonly auditLog: AuditLogService,
  ) {}

  listConversations(userId: string) {
    return this.conversationModel
      .find({ participantIds: new Types.ObjectId(userId) })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();
  }

  async createDirectConversation(participantId: string, actor: AuditActor) {
    if (participantId === actor.userId) {
      throw new BadRequestException('Participant invalide.');
    }

    const [actorUser, otherUser] = await Promise.all([
      this.userModel.findById(actor.userId).lean().exec(),
      this.userModel.findById(participantId).lean().exec(),
    ]);
    if (!actorUser || !otherUser) {
      throw new BadRequestException('Utilisateur introuvable.');
    }

    const existing = await this.conversationModel
      .findOne({
        type: 'direct',
        participantIds: {
          $all: [new Types.ObjectId(actor.userId), new Types.ObjectId(participantId)],
        },
      })
      .exec();
    if (existing) return existing;

    const conversation = await this.conversationModel.create({
      type: 'direct',
      participantIds: [actor.userId, participantId],
      createdBy: actor.userId,
    });

    await this.auditLog.log({
      action: 'messaging.conversation.create',
      entity: 'conversation',
      entityId: String(conversation._id),
      actor,
      metadata: { type: 'direct', participantId },
    });

    return conversation;
  }

  async createGroupConversation(
    title: string,
    participantIds: string[],
    actor: AuditActor,
  ) {
    const unique = Array.from(new Set([actor.userId, ...participantIds]));
    if (unique.length < 3) {
      throw new BadRequestException('Un groupe doit contenir au moins 3 membres.');
    }

    const count = await this.userModel
      .countDocuments({ _id: { $in: unique.map((id) => new Types.ObjectId(id)) } })
      .exec();
    if (count !== unique.length) {
      throw new BadRequestException('Un ou plusieurs utilisateurs sont invalides.');
    }

    const conversation = await this.conversationModel.create({
      type: 'group',
      title: title.trim(),
      participantIds: unique,
      createdBy: actor.userId,
    });

    await this.auditLog.log({
      action: 'messaging.group.create',
      entity: 'conversation',
      entityId: String(conversation._id),
      actor,
      metadata: { title: conversation.title, participants: unique.length },
    });

    return conversation;
  }

  async listMessages(
    conversationId: string,
    userId: string,
    pagination: { skip: number; limit: number },
  ) {
    await this.ensureParticipant(conversationId, userId);
    const [items, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.messageModel
        .countDocuments({ conversationId: new Types.ObjectId(conversationId) })
        .exec(),
    ]);
    return { items, total };
  }

  async createMessage(
    conversationId: string,
    data: { body?: string; attachmentIds?: string[] },
    actor: AuditActor,
  ) {
    await this.ensureParticipant(conversationId, actor.userId);

    const body = data.body?.trim();
    const attachmentIds = data.attachmentIds ?? [];
    if (!body && attachmentIds.length === 0) {
      throw new BadRequestException('Message vide.');
    }

    if (attachmentIds.length > 0) {
      const attachments = await this.attachmentModel
        .find({ _id: { $in: attachmentIds }, conversationId: new Types.ObjectId(conversationId) })
        .lean()
        .exec();
      if (attachments.length !== attachmentIds.length) {
        throw new BadRequestException('Pièces jointes invalides.');
      }
    }

    const message = await this.messageModel.create({
      conversationId,
      senderId: actor.userId,
      body,
      attachmentIds,
    });

    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        lastMessageAt: message.createdAt ?? new Date(),
        lastMessageSnippet: body ? body.slice(0, 120) : 'Pièce jointe',
      })
      .exec();

    await this.auditLog.log({
      action: 'messaging.message.create',
      entity: 'message',
      entityId: String(message._id),
      actor,
      metadata: { conversationId, hasBody: !!body, attachments: attachmentIds.length },
    });

    return message;
  }

  async createAttachment(
    conversationId: string,
    file: {
      originalname: string;
      filename: string;
      path: string;
      mimetype: string;
      size: number;
    },
    actor: AuditActor,
  ) {
    await this.ensureParticipant(conversationId, actor.userId);

    const attachment = await this.attachmentModel.create({
      conversationId,
      uploadedBy: actor.userId,
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    });

    await this.auditLog.log({
      action: 'messaging.attachment.create',
      entity: 'attachment',
      entityId: String(attachment._id),
      actor,
      metadata: { conversationId, mimeType: file.mimetype, size: file.size },
    });

    return attachment;
  }

  async getAttachment(attachmentId: string, actor: AuditActor) {
    const attachment = await this.attachmentModel.findById(attachmentId).lean().exec();
    if (!attachment) {
      throw new BadRequestException('Pièce jointe introuvable.');
    }
    await this.ensureParticipant(String(attachment.conversationId), actor.userId);
    return attachment;
  }

  /**
   * UC-E07 — Broadcast d'un message à tous les étudiants d'un groupe.
   * Crée (ou réutilise) une conversation de groupe et envoie le message.
   */
  async broadcastToGroup(
    groupId: string,
    content: string,
    actor: AuditActor,
  ) {
    if (!content?.trim()) throw new BadRequestException('Message vide.');

    // Récupérer les étudiants du groupe
    const students = await this.studentModel
      .find({ groupId: new Types.ObjectId(groupId) })
      .lean()
      .exec();

    if (students.length === 0) {
      throw new BadRequestException('Aucun étudiant dans ce groupe.');
    }

    // Récupérer les comptes utilisateurs des étudiants (par email)
    const emails = students.map((s) => (s as any).email).filter(Boolean);
    const users = await this.userModel.find({ email: { $in: emails } }).lean().exec();

    const participantIds = [
      new Types.ObjectId(actor.userId),
      ...users.map((u) => u._id as Types.ObjectId),
    ];

    // Créer une conversation de groupe dédiée à ce broadcast
    const title = `Annonce groupe — ${new Date().toLocaleDateString('fr-FR')}`;
    const conversation = await this.conversationModel.create({
      type: 'group',
      title,
      participantIds,
      lastMessageAt: new Date(),
    });

    // Envoyer le message
    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(actor.userId),
      body: content.trim(),
    });

    await this.auditLog.log({
      action: 'messages.broadcast',
      entity: 'group',
      entityId: groupId,
      actor,
      metadata: { recipients: participantIds.length - 1, conversationId: String(conversation._id) },
    });

    return { conversation, message, recipientCount: participantIds.length - 1 };
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    const convo = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        participantIds: new Types.ObjectId(userId),
      })
      .lean()
      .exec();
    if (!convo) {
      throw new ForbiddenException('Accès refusé à la conversation.');
    }
    return convo;
  }
}
