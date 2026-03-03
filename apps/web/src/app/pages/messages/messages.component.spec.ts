import {TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {MessagesComponent} from './messages.component';
import {MessagesApi} from '../../core/api/messages.api';
import {of} from 'rxjs';

describe('MessagesComponent', () => {
  const apiMock = () => ({
    listConversations: jasmine.createSpy('listConversations').and.returnValue(of([])),
    listMessages: jasmine.createSpy('listMessages').and.returnValue(of({ items: [], total: 0 })),
    createDirectConversation: jasmine.createSpy('createDirectConversation').and.returnValue(of({})),
    createGroupConversation: jasmine.createSpy('createGroupConversation').and.returnValue(of({})),
    createMessage: jasmine.createSpy('createMessage').and.returnValue(of({})),
    uploadAttachment: jasmine.createSpy('uploadAttachment').and.returnValue(of({ _id: 'a1', originalName: 'doc.pdf' })),
    attachmentDownloadUrl: jasmine.createSpy('attachmentDownloadUrl').and.returnValue('http://localhost/a1'),
  });

  function setup() {
    const api = apiMock();
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [{ provide: MessagesApi, useValue: api }],
    });
    const comp = TestBed.runInInjectionContext(() => new MessagesComponent());
    return { comp, api };
  }

  it('selectConversation triggers refresh', () => {
    const { comp, api } = setup();
    comp.selectConversation({ _id: 'c1', type: 'direct', participantIds: [], createdBy: 'u1' } as any);
    comp.messages$.subscribe();
    expect(api.listMessages).toHaveBeenCalled();
  });

  it('createDirect calls API', () => {
    const { comp, api } = setup();
    comp.directForm.setValue({ participantId: 'u1' });
    comp.createDirect();
    expect(api.createDirectConversation).toHaveBeenCalledWith('u1');
  });

  it('createGroup calls API', () => {
    const { comp, api } = setup();
    comp.groupForm.setValue({ title: 'G1', participantIds: 'u1, u2' });
    comp.createGroup();
    expect(api.createGroupConversation).toHaveBeenCalledWith('G1', ['u1', 'u2']);
  });

  it('sendMessage calls API with attachments', () => {
    const { comp, api } = setup();
    comp['selectedConversationId$'].next('c1');
    comp.pendingAttachments = [{ _id: 'a1', originalName: 'doc.pdf' } as any];
    comp.messageForm.setValue({ body: 'hello' });
    comp.sendMessage();
    expect(api.createMessage).toHaveBeenCalledWith('c1', { body: 'hello', attachmentIds: ['a1'] });
  });

  it('onFileSelected uploads', () => {
    const { comp, api } = setup();
    comp['selectedConversationId$'].next('c1');
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    comp.onFileSelected({ target: { files: [file] } } as any);
    expect(api.uploadAttachment).toHaveBeenCalled();
  });

  it('attachmentUrl delegates to API', () => {
    const { comp, api } = setup();
    comp.attachmentUrl('a1');
    expect(api.attachmentDownloadUrl).toHaveBeenCalledWith('a1');
  });
});
