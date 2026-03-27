import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { InputFieldComponent } from '@shared/components/input-field/input-field.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, InputFieldComponent, CustomButtonComponent, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-page__hero">
        <img src="assets/images/signup-car.png" class="auth-page__hero-img" alt="Car" />
        <h2 class="auth-page__hero-title">Create Your Account</h2>
      </div>

      <div class="auth-page__form">
        @if (verification().state === 'default') {
          <form [formGroup]="signUpForm" (ngSubmit)="onSignUp()">
            <div class="form-field">
              <label class="form-field__label">Name</label>
              <div class="form-field__container" [class.form-field__container--error]="showError('name')">
                <img src="assets/icons/person.png" class="form-field__icon" alt="" />
                <input type="text" formControlName="name" class="form-field__input" placeholder="Enter name" />
              </div>
              @if (showError('name')) {
                <span class="form-field__error">Name is required</span>
              }
            </div>

            <div class="form-field">
              <label class="form-field__label">Email</label>
              <div class="form-field__container" [class.form-field__container--error]="showError('email')">
                <img src="assets/icons/email.png" class="form-field__icon" alt="" />
                <input type="email" formControlName="email" class="form-field__input" placeholder="Enter email" />
              </div>
              @if (showError('email')) {
                <span class="form-field__error">Valid email is required</span>
              }
            </div>

            <div class="form-field">
              <label class="form-field__label">Password</label>
              <div class="form-field__container" [class.form-field__container--error]="showError('password')">
                <img src="assets/icons/lock.png" class="form-field__icon" alt="" />
                <input type="password" formControlName="password" class="form-field__input" placeholder="Enter password" />
              </div>
              @if (showError('password')) {
                <span class="form-field__error">Password must be at least 8 characters</span>
              }
            </div>

            @if (error()) {
              <p class="auth-page__error">{{ error() }}</p>
            }

            <div class="auth-page__submit">
              <app-custom-button
                [title]="isLoading() ? 'Creating account...' : 'Sign Up'"
                [disabled]="signUpForm.invalid || isLoading()"
                (pressed)="onSignUp()"
              />
            </div>
          </form>

          <p class="auth-page__link">
            Already have an account?
            <a routerLink="/auth/sign-in" class="auth-page__link--primary">Log In</a>
          </p>
        }

        @if (verification().state === 'pending') {
          <div class="modal-overlay">
            <div class="modal">
              <h3 class="modal__title">Verification</h3>
              <p class="modal__desc">We've sent a verification code to {{ signUpForm.get('email')?.value }}.</p>
              <app-input-field
                label="Code"
                placeholder="12345"
                icon="assets/icons/lock.png"
                [value]="verification().code"
                (valueChange)="updateVerification('code', $event)"
              />
              @if (verification().error) {
                <p class="auth-page__error">{{ verification().error }}</p>
              }
              <div class="modal__action">
                <app-custom-button title="Verify Email" bgVariant="success" (pressed)="onVerify()" />
              </div>
            </div>
          </div>
        }

        @if (verification().state === 'success') {
          <div class="modal-overlay">
            <div class="modal modal--success">
              <img src="assets/images/check.png" class="modal__check-img" alt="Verified" />
              <h3 class="modal__title modal__title--center">Verified</h3>
              <p class="modal__desc modal__desc--center">You have successfully verified your account.</p>
              <div class="modal__action">
                <app-custom-button title="Browse Home" (pressed)="goHome()" />
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './sign-up.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignUpComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly signUpForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly verification = signal({ state: 'default', error: '', code: '' });
  readonly error = signal('');
  readonly isLoading = signal(false);
  private submitted = false;

  showError(field: 'name' | 'email' | 'password'): boolean {
    const control = this.signUpForm.get(field);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  updateVerification(field: 'code', value: string) {
    this.verification.update(v => ({ ...v, [field]: value }));
  }

  async onSignUp() {
    this.submitted = true;
    this.error.set('');
    if (this.signUpForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    try {
      const { email, password } = this.signUpForm.getRawValue();
      await this.auth.signUpWithEmail(email, password);
      this.verification.update(v => ({ ...v, state: 'pending' }));
    } catch (err: unknown) {
      const message = (err as { errors?: { longMessage: string }[] })?.errors?.[0]?.longMessage;
      this.error.set(message || 'Sign up failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onVerify() {
    try {
      await this.auth.verifyEmailOTP(this.verification().code);

      const { name, email } = this.signUpForm.getRawValue();
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/user`, {
          name,
          email,
          clerkId: this.auth.user()?.id,
        })
      ).catch(() => { /* backend user creation is best-effort */ });

      this.verification.update(v => ({ ...v, state: 'success' }));
    } catch (err: unknown) {
      const message = (err as { errors?: { longMessage: string }[] })?.errors?.[0]?.longMessage;
      this.verification.update(v => ({
        ...v,
        error: message || 'Verification failed. Please try again.',
        state: 'failed',
      }));
    }
  }

  goHome() {
    this.router.navigate(['/app/home']);
  }
}
