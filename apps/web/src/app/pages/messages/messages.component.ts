import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessagesApi, Conversation, Message, Attachment } from '../../core/api/messages.api';
import { BehaviorSubject, combineLatest, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent {
  private readonly api = inject(MessagesApi);
  private readonly fb = inject(FormBuilder);

  private readonly refreshConversations$ = new BehaviorSubject<void>(undefined);
  private readonly selectedConversationId$ = new BehaviorSubject<string | null>(null);
  private readonly refreshMessages$ = new BehaviorSubject<void>(undefined);

  conversations$ = this.refreshConversations$.pipe(
    switchMap(() => this.api.listConversations()),
  );

  selectedConversation$ = combineLatest([
    this.conversations$,
    this.selectedConversationId$,
  ]).pipe(
    map(([convos, id]) => convos.find((c) => c._id === id) ?? null),
  );

  messages$ = combineLatest([
    this.selectedConversationId$,
    this.refreshMessages$,
  ]).pipe(
    switchMap(([id]) => {
      if (!id) return of({ items: [], total: 0 });
      return this.api.listMessages(id, 1, 50);
    }),
    map((res) => res.items),
  );

  pendingAttachments: Attachment[] = [];
  uploading = false;

  directForm = this.fb.group({
    participantId: ['', Validators.required],
  });

  groupForm = this.fb.group({
    title: ['', Validators.required],
    participantIds: ['', Validators.required],
  });

  messageForm = this.fb.group({
    body: [''],
  });

  selectConversation(convo: Conversation) {
    this.selectedConversationId$.next(convo._id);
    this.refreshMessages();
  }

  refreshConversations() {
    this.refreshConversations$.next();
  }

  refreshMessages() {
    this.refreshMessages$.next();
  }

  createDirect() {
    if (this.directForm.invalid) return;
    const participantId = this.directForm.value.participantId as string;
    this.api.createDirectConversation(participantId).subscribe(() => {
      this.directForm.reset();
      this.refreshConversations();
    });
  }

  createGroup() {
    if (this.groupForm.invalid) return;
    const title = this.groupForm.value.title as string;
    const raw = (this.groupForm.value.participantIds as string) ?? '';
    const participantIds = raw
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    this.api.createGroupConversation(title, participantIds).subscribe(() => {
      this.groupForm.reset();
      this.refreshConversations();
    });
  }

  sendMessage() {
    const conversationId = this.selectedConversationId$.value;
    if (!conversationId) return;
    const body = (this.messageForm.value.body ?? '').toString();
    const attachmentIds = this.pendingAttachments.map((a) => a._id);
    this.api
      .createMessage(conversationId, { body, attachmentIds })
      .subscribe(() => {
        this.messageForm.reset();
        this.pendingAttachments = [];
        this.refreshMessages();
        this.refreshConversations();
      });
  }

  onFileSelected(event: Event) {
    const conversationId = this.selectedConversationId$.value;
    const input = event.target as HTMLInputElement;
    if (!conversationId || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploading = true;
    this.api.uploadAttachment(conversationId, file).subscribe({
      next: (attachment) => {
        this.pendingAttachments = [...this.pendingAttachments, attachment];
        this.uploading = false;
        input.value = '';
      },
      error: () => {
        this.uploading = false;
      },
    });
  }

  attachmentUrl(id: string) {
    return this.api.attachmentDownloadUrl(id);
  }
}
