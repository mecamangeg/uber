import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for Clerk to finish initializing before checking auth state
  if (auth.isLoading()) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (!auth.isLoading()) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth/welcome']);
  return false;
};
