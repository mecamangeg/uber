import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { DriverPortalService } from '@core/services/driver-portal.service';
import type { DriverRegistration } from '@models/driver-portal.model';

@Component({
  selector: 'app-driver-register',
  imports: [FormsModule],
  template: `
    <div class="register">
      <div class="register__card">
        <h2 class="register__title">Become a Ryde Driver</h2>
        <div class="register__steps">
          <div class="register__step" [class.register__step--active]="step() >= 1" [class.register__step--done]="step() > 1">1</div>
          <div class="register__step-line" [class.register__step-line--done]="step() > 1"></div>
          <div class="register__step" [class.register__step--active]="step() >= 2" [class.register__step--done]="step() > 2">2</div>
          <div class="register__step-line" [class.register__step-line--done]="step() > 2"></div>
          <div class="register__step" [class.register__step--active]="step() >= 3">3</div>
        </div>

        @if (step() === 1) {
          <h3 class="register__subtitle">Personal Information</h3>
          <div class="register__field">
            <label class="register__label">First Name</label>
            <input class="register__input" [(ngModel)]="form.first_name" placeholder="Juan" />
          </div>
          <div class="register__field">
            <label class="register__label">Last Name</label>
            <input class="register__input" [(ngModel)]="form.last_name" placeholder="Santos" />
          </div>
          <div class="register__field">
            <label class="register__label">Email</label>
            <input class="register__input" [value]="form.email" disabled />
          </div>
          <div class="register__field">
            <label class="register__label">Phone</label>
            <input class="register__input" [(ngModel)]="form.phone" placeholder="+63 912 345 6789" />
          </div>
          <button class="register__btn" (click)="nextStep()" [disabled]="!form.first_name || !form.last_name">
            Next
          </button>
        }

        @if (step() === 2) {
          <h3 class="register__subtitle">Vehicle Information</h3>
          <div class="register__row">
            <div class="register__field">
              <label class="register__label">Car Make</label>
              <input class="register__input" [(ngModel)]="form.car_make" placeholder="Toyota" />
            </div>
            <div class="register__field">
              <label class="register__label">Car Model</label>
              <input class="register__input" [(ngModel)]="form.car_model" placeholder="Vios" />
            </div>
          </div>
          <div class="register__row">
            <div class="register__field">
              <label class="register__label">Year</label>
              <input class="register__input" type="number" [(ngModel)]="form.car_year" placeholder="2023" />
            </div>
            <div class="register__field">
              <label class="register__label">Color</label>
              <input class="register__input" [(ngModel)]="form.car_color" placeholder="White" />
            </div>
          </div>
          <div class="register__field">
            <label class="register__label">Seats</label>
            <input class="register__input" type="number" [(ngModel)]="form.car_seats" placeholder="4" />
          </div>
          <div class="register__field">
            <label class="register__label">License Plate</label>
            <input class="register__input" [(ngModel)]="form.license_plate" placeholder="ABC 1234" />
          </div>
          <div class="register__field">
            <label class="register__label">License Number</label>
            <input class="register__input" [(ngModel)]="form.license_number" placeholder="N01-23-456789" />
          </div>
          <div class="register__btn-row">
            <button class="register__btn register__btn--secondary" (click)="prevStep()">Back</button>
            <button class="register__btn" (click)="nextStep()" [disabled]="!form.car_make || !form.car_model">Next</button>
          </div>
        }

        @if (step() === 3) {
          <h3 class="register__subtitle">Review & Submit</h3>
          <div class="register__review">
            <div class="register__review-section">
              <h4 class="register__review-heading">Personal</h4>
              <p>{{ form.first_name }} {{ form.last_name }}</p>
              <p>{{ form.email }}</p>
              <p>{{ form.phone }}</p>
            </div>
            <div class="register__review-section">
              <h4 class="register__review-heading">Vehicle</h4>
              <p>{{ form.car_year }} {{ form.car_make }} {{ form.car_model }} ({{ form.car_color }})</p>
              <p>{{ form.car_seats }} seats</p>
              <p>Plate: {{ form.license_plate }}</p>
              <p>License: {{ form.license_number }}</p>
            </div>
          </div>
          <div class="register__btn-row">
            <button class="register__btn register__btn--secondary" (click)="prevStep()">Back</button>
            <button class="register__btn" (click)="onSubmit()" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Registering...' : 'Register as Driver' }}
            </button>
          </div>
          @if (error()) {
            <p class="register__error">{{ error() }}</p>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './driver-register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverRegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly portal = inject(DriverPortalService);
  private readonly router = inject(Router);

  readonly step = signal(1);
  readonly isSubmitting = signal(false);
  readonly error = signal('');

  form: DriverRegistration = {
    clerk_id: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    car_make: '',
    car_model: '',
    car_year: new Date().getFullYear(),
    car_color: '',
    car_seats: 4,
    license_plate: '',
    license_number: '',
  };

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.form.clerk_id = user.id;
      this.form.email = user.primaryEmailAddress?.emailAddress || '';
      this.form.first_name = user.firstName || '';
      this.form.last_name = user.lastName || '';
    }
  }

  nextStep() { this.step.update(s => Math.min(s + 1, 3)); }
  prevStep() { this.step.update(s => Math.max(s - 1, 1)); }

  async onSubmit() {
    this.isSubmitting.set(true);
    this.error.set('');
    try {
      await this.portal.register(this.form);
      this.router.navigate(['/driver/dashboard']);
    } catch (e: any) {
      this.error.set(e?.error?.error || 'Registration failed. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
