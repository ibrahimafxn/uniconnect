import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Room = {
  _id: string;
  name: string;
  capacity: number;
  location?: string;
};

export type Session = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupId: string;
  teacherId: string;
  roomId: string;
  label?: string;
};

@Injectable({ providedIn: 'root' })
export class PlanningApi {
  private readonly baseUrl = 'http://localhost:3000/api/planning';

  constructor(private readonly http: HttpClient) {}

  listRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/rooms`);
  }

  createRoom(payload: Omit<Room, '_id'>) {
    return this.http.post<Room>(`${this.baseUrl}/rooms`, payload);
  }

  updateRoom(id: string, payload: Partial<Omit<Room, '_id'>>) {
    return this.http.patch<Room>(`${this.baseUrl}/rooms/${id}`, payload);
  }

  deleteRoom(id: string) {
    return this.http.delete<Room>(`${this.baseUrl}/rooms/${id}`);
  }

  listSessions(params?: {
    dateFrom?: string;
    dateTo?: string;
    groupId?: string;
    teacherId?: string;
    roomId?: string;
  }): Observable<Session[]> {
    let httpParams = new HttpParams();
    if (params?.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params?.groupId) httpParams = httpParams.set('groupId', params.groupId);
    if (params?.teacherId) httpParams = httpParams.set('teacherId', params.teacherId);
    if (params?.roomId) httpParams = httpParams.set('roomId', params.roomId);
    return this.http.get<Session[]>(`${this.baseUrl}/sessions`, {
      params: httpParams,
    });
  }

  createSession(payload: Omit<Session, '_id'>) {
    return this.http.post<Session>(`${this.baseUrl}/sessions`, payload);
  }

  updateSession(id: string, payload: Partial<Omit<Session, '_id'>>) {
    return this.http.patch<Session>(`${this.baseUrl}/sessions/${id}`, payload);
  }

  deleteSession(id: string) {
    return this.http.delete<Session>(`${this.baseUrl}/sessions/${id}`);
  }
}
