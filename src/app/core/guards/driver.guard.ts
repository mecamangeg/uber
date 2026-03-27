import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DriverPortalService } from '../services/driver-portal.service';
import { environment } from '@env';

export const driverGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const driverPortal = inject(DriverPortalService);
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

  // In dev bypass mode, always allow driver access
  if (environment.devBypassAuth) return true;

  // Check if user has a driver profile
  const clerkId = auth.user()?.id;
  if (!clerkId) {
    router.navigate(['/app/home']);
    return false;
  }

  const profile = await driverPortal.loadProfile(clerkId);
  if (!profile) {
    router.navigate(['/driver-register']);
    return false;
  }

  return true;
};
