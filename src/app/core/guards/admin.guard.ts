import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '@env';

/** Admin email allowlist — add real admin emails here for production. */
const ADMIN_EMAILS = ['dev@ryde.test', 'admin@ryde.app', 'mecamangeg@gmail.com'];

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to finish loading
  if (auth.isLoading()) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (!auth.isLoading()) { clearInterval(check); resolve(); }
      }, 50);
    });
  }

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/welcome']);
    return false;
  }

  // In dev bypass mode, always allow admin access
  if (environment.devBypassAuth) return true;

  const email = auth.user()?.primaryEmailAddress?.emailAddress;
  if (email && ADMIN_EMAILS.includes(email)) return true;

  router.navigate(['/app/home']);
  return false;
};
