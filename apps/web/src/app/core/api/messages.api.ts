import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Conversation = {
  _id: string;
  type: 'direct' | 'group';
  title?: string;
  participantIds: string[];
  createdBy: string;
  lastMessageAt?: string;
  lastMessageSnippet?: string;
};

export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  body?: string;
  attachmentIds: string[];
  createdAt: string;
};

export type Attachment = {
  _id: string;
  conversationId: string;
  uploadedBy: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
};

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private readonly baseUrl = 'http://localhost:3000/api/messages';

  constructor(private readonly http: HttpClient) {}

  listConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`);
  }

  createDirectConversation(participantId: string) {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations/direct`, {
      participantId,
    });
  }

  createGroupConversation(title: string, participantIds: string[]) {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations/group`, {
      title,
      participantIds,
    });
  }

  listMessages(conversationId: string, page = 1, limit = 20) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<{ items: Message[]; total: number }>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { params },
    );
  }

  createMessage(conversationId: string, payload: { body?: string; attachmentIds?: string[] }) {
    return this.http.post<Message>(`${this.baseUrl}/conversations/${conversationId}/messages`, payload);
  }

  uploadAttachment(conversationId: string, file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<Attachment>(`${this.baseUrl}/attachments`, data, {
      params: new HttpParams().set('conversationId', conversationId),
    });
  }

  attachmentDownloadUrl(attachmentId: string) {
    return `${this.baseUrl}/attachments/${attachmentId}/download`;
  }

  /** UC-E07 — Broadcast d'un message à tous les étudiants d'un groupe */
  broadcastToGroup(groupId: string, content: string) {
    return this.http.post<{ conversation: Conversation; message: Message; recipientCount: number }>(
      `${this.baseUrl}/broadcast/group`,
      { groupId, content },
    );
  }
}
