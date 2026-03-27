import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, CustomButtonComponent, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-page__hero">
        <img src="assets/images/signup-car.png" class="auth-page__hero-img" alt="Car" />
        <h2 class="auth-page__hero-title">Welcome</h2>
      </div>

      <div class="auth-page__form">
        <form [formGroup]="form" (ngSubmit)="onSignIn()">
          <div class="form-field">
            <label class="form-field__label" for="signin-email">Email</label>
            <div class="form-field__container" [class.form-field__container--error]="showError('email')">
              <img src="assets/icons/email.png" class="form-field__icon" alt="" />
              <input id="signin-email" type="email" formControlName="email" class="form-field__input"
                placeholder="Enter email" [attr.aria-describedby]="showError('email') ? 'signin-email-error' : null" />
            </div>
            @if (showError('email')) {
              <span id="signin-email-error" class="form-field__error" role="alert">Valid email is required</span>
            }
          </div>

          <div class="form-field">
            <label class="form-field__label" for="signin-password">Password</label>
            <div class="form-field__container" [class.form-field__container--error]="showError('password')">
              <img src="assets/icons/lock.png" class="form-field__icon" alt="" />
              <input id="signin-password" type="password" formControlName="password" class="form-field__input"
                placeholder="Enter password" [attr.aria-describedby]="showError('password') ? 'signin-password-error' : null" />
            </div>
            @if (showError('password')) {
              <span id="signin-password-error" class="form-field__error" role="alert">Password is required</span>
            }
          </div>

          @if (error()) {
            <p class="auth-page__error">{{ error() }}</p>
          }

          <div class="auth-page__submit">
            <app-custom-button
              [title]="isLoading() ? 'Signing in...' : 'Sign In'"
              [disabled]="form.invalid || isLoading()"
              (pressed)="onSignIn()"
            />
          </div>
        </form>

        <p class="auth-page__link">
          Don't have an account?
          <a routerLink="/auth/sign-up" class="auth-page__link--primary">Sign Up</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: './sign-in.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignInComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/app/home']);
    }
  }

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  readonly error = signal('');
  readonly isLoading = signal(false);
  private submitted = false;

  showError(field: 'email' | 'password'): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  async onSignIn() {
    this.submitted = true;
    this.error.set('');
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      const result = await this.auth.signInWithEmail(email, password);
      if (result.status === 'complete') {
        this.router.navigate(['/app/home']);
      } else {
        this.error.set('Sign in failed. Please try again.');
      }
    } catch (err: unknown) {
      const message = (err as { errors?: { longMessage: string }[] })?.errors?.[0]?.longMessage;
      this.error.set(message || 'Sign in failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
