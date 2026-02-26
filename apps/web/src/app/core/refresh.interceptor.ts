import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthService} from './auth.service';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.logout().subscribe();
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
          auth.logout().subscribe();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
