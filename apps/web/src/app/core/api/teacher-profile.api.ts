import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export type TeacherGrade =
  | 'assistant'
  | 'maitre_conferences'
  | 'professeur'
  | 'vacataire'
  | 'autre';

export type TeacherProfile = {
  _id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  grade?: TeacherGrade;
  bio?: string;
  phone?: string;
  office?: string;
};

@Injectable({providedIn: 'root'})
export class TeacherProfileApi {
  private readonly baseUrl = 'http://localhost:3000/api/teacher-profile';

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<TeacherProfile | null> {
    return this.http.get<TeacherProfile | null>(`${this.baseUrl}/me`);
  }

  upsertMyProfile(payload: Omit<TeacherProfile, '_id' | 'userId'>): Observable<TeacherProfile> {
    return this.http.put<TeacherProfile>(`${this.baseUrl}/me`, payload);
  }
}
