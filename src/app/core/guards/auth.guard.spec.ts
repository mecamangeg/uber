import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  function setup(opts: { isAuthenticated: boolean; isLoading: boolean }) {
    const mockAuth = {
      isAuthenticated: signal(opts.isAuthenticated),
      isLoading: signal(opts.isLoading),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: router },
      ],
    });
  }

  it('should return false and redirect when not authenticated', async () => {
    setup({ isAuthenticated: false, isLoading: false });
    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/welcome']);
  });

  it('should return true when authenticated', async () => {
    setup({ isAuthenticated: true, isLoading: false });
    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should wait for loading to complete before checking auth', async () => {
    const isLoading = signal(true);
    const isAuthenticated = signal(false);
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated, isLoading } },
        { provide: Router, useValue: router },
      ],
    });

    // Simulate Clerk finishing load after 100ms
    setTimeout(() => {
      isAuthenticated.set(true);
      isLoading.set(false);
    }, 100);

    const result = await TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });
});
