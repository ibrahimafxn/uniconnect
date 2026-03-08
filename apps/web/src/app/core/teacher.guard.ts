import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';

export const teacherGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.parseUrl('/login');

  const role = auth.getUserRole();
  if (role === 'teacher' || role === 'external') return true;

  if (role === 'student') return router.parseUrl('/student');
  return router.parseUrl('/dashboard');
};
