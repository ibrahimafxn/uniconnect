import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthService} from './auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthEndpoint =
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/logout');

  if (isAuthEndpoint || req.method === 'OPTIONS') {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      if (isAuthEndpoint) {
        return throwError(() => err);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.logoutLocal();
        return throwError(() => err);
      }

      return auth.refresh().pipe(
        switchMap(() => {
          const accessToken = auth.getAccessToken();
          if (!accessToken) {
            return throwError(() => err);
          }
          const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${accessToken}` },
          });
          return next(authReq);
        }),
        catchError((refreshErr) => {
          auth.logoutLocal();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
