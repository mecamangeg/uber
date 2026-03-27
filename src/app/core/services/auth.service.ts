import { Injectable, signal, computed } from '@angular/core';
import { Clerk } from '@clerk/clerk-js';
import type { Resources, UserResource } from '@clerk/shared/types';
import { environment } from '@env';

const MOCK_USER = {
  id: 'dev_user_001',
  firstName: 'Dev',
  lastName: 'User',
  fullName: 'Dev User',
  imageUrl: 'assets/icons/profile.png',
  primaryEmailAddress: { emailAddress: 'dev@ryde.test' },
  primaryPhoneNumber: { phoneNumber: '+1 555-0100' },
  emailAddresses: [{ emailAddress: 'dev@ryde.test' }],
} as unknown as UserResource;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private clerk!: Clerk;

  readonly user = signal<UserResource | null>(null);
  readonly isLoading = signal(true);
  readonly isAuthenticated = computed(() => !!this.user());

  async initialize(): Promise<void> {
    if (environment.devBypassAuth) {
      this.user.set(MOCK_USER);
      this.isLoading.set(false);
      return;
    }

    try {
      this.clerk = new Clerk(environment.clerkPublishableKey);
      await this.clerk.load();

      this.clerk.addListener((resources: Resources) => {
        this.user.set(resources.user ?? null);
        this.isLoading.set(false);
      });
    } catch (e) {
      console.error('Clerk initialization failed:', e);
      this.isLoading.set(false);
    }
  }

  get clerkInstance(): Clerk { return this.clerk; }

  async signInWithEmail(email: string, password: string) {
    if (environment.devBypassAuth) {
      this.user.set(MOCK_USER);
      return { status: 'complete' as const, createdSessionId: 'dev_session' };
    }

    const signIn = this.clerk.client!.signIn;
    const result = await signIn.create({ strategy: 'password', identifier: email, password });
    if (result.status === 'complete' && result.createdSessionId) {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
    return result;
  }

  async signUpWithEmail(email: string, password: string) {
    if (environment.devBypassAuth) {
      this.user.set(MOCK_USER);
      return;
    }

    const signUp = this.clerk.client!.signUp;
    const result = await signUp.create({ emailAddress: email, password });
    await result.prepareEmailAddressVerification({ strategy: 'email_code' });
    return result;
  }

  async verifyEmailOTP(code: string) {
    if (environment.devBypassAuth) return;

    const signUp = this.clerk.client!.signUp;
    const result = await signUp.attemptEmailAddressVerification({ code });
    if (result.status === 'complete' && result.createdSessionId) {
      await this.clerk.setActive({ session: result.createdSessionId });
    }
  }

  async signOut(): Promise<void> {
    if (environment.devBypassAuth) {
      this.user.set(null);
      return;
    }

    await this.clerk.signOut();
    this.user.set(null);
  }

  async getToken(): Promise<string | null> {
    if (environment.devBypassAuth) return 'dev_token';

    const session = this.clerk.session;
    return session ? await session.getToken() : null;
  }
}
