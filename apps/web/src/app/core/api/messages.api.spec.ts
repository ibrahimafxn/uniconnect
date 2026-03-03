import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {MessagesApi} from './messages.api';

describe('MessagesApi', () => {
  let api: MessagesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MessagesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listConversations calls API', () => {
    api.listConversations().subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/messages/conversations');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createDirectConversation posts payload', () => {
    api.createDirectConversation('u1').subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/messages/conversations/direct');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'c1', type: 'direct' });
  });

  it('createGroupConversation posts payload', () => {
    api.createGroupConversation('G1', ['u1', 'u2']).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/messages/conversations/group');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'c2', type: 'group' });
  });

  it('listMessages calls API with params', () => {
    api.listMessages('c1', 2, 10).subscribe();
    const req = httpMock.expectOne((request) => request.url === 'http://localhost:3000/api/messages/conversations/c1/messages');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ items: [], total: 0 });
  });

  it('createMessage posts payload', () => {
    api.createMessage('c1', { body: 'hi' }).subscribe();
    const req = httpMock.expectOne('http://localhost:3000/api/messages/conversations/c1/messages');
    expect(req.request.method).toBe('POST');
    req.flush({ _id: 'm1' });
  });

  it('uploadAttachment posts form data', () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    api.uploadAttachment('c1', file).subscribe();
    const req = httpMock.expectOne((request) => request.url === 'http://localhost:3000/api/messages/attachments');
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('conversationId')).toBe('c1');
    req.flush({ _id: 'a1' });
  });

  it('attachmentDownloadUrl builds path', () => {
    expect(api.attachmentDownloadUrl('a1')).toBe('http://localhost:3000/api/messages/attachments/a1/download');
  });
});
