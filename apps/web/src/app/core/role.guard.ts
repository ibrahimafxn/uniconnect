import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';

export const roleGuard = (allowed: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) return router.parseUrl('/login');

    const role = auth.getUserRole() ?? '';
    if (allowed.includes(role)) return true;

    if (role === 'student') return router.parseUrl('/student');
    if (role === 'teacher' || role === 'external') return router.parseUrl('/teacher');
    return router.parseUrl('/dashboard');
  };
};
