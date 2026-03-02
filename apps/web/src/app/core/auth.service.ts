import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${this.baseUrl}/auth/login`, { email, password })
      .pipe(tap((tokens) => this.setTokens(tokens)));
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<AuthTokens>(`${this.baseUrl}/auth/refresh`, { refreshToken })
      .pipe(tap((tokens) => this.setTokens(tokens)));
  }

  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearTokens()),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  getUserRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload?.role ?? null;
  }

  getUserEmail(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload?.email ?? null;
  }

  private decodeToken(token: string): any | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private setTokens(tokens: AuthTokens) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
