import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { DriverPortalService } from '@core/services/driver-portal.service';

@Component({
  selector: 'app-driver-profile',
  imports: [FormsModule],
  template: `
    <div class="driver-page">
      <h2 class="driver-page__title">Driver Profile</h2>

      @if (portal.profile(); as p) {
        <div class="profile-card">
          <div class="profile-card__header">
            <div class="profile-card__avatar">{{ p.first_name[0] }}{{ p.last_name[0] }}</div>
            <div>
              <h3 class="profile-card__name">{{ p.first_name }} {{ p.last_name }}</h3>
              <p class="profile-card__email">{{ p.email }}</p>
              <p class="profile-card__rating">Rating: {{ p.rating }}</p>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h3 class="profile-section__title">Vehicle Information</h3>
          <div class="profile-form__row">
            <div class="profile-form__field">
              <label class="profile-form__label">Make</label>
              <input class="profile-form__input" [(ngModel)]="vehicleForm.car_make" />
            </div>
            <div class="profile-form__field">
              <label class="profile-form__label">Model</label>
              <input class="profile-form__input" [(ngModel)]="vehicleForm.car_model" />
            </div>
          </div>
          <div class="profile-form__row">
            <div class="profile-form__field">
              <label class="profile-form__label">Year</label>
              <input class="profile-form__input" type="number" [(ngModel)]="vehicleForm.car_year" />
            </div>
            <div class="profile-form__field">
              <label class="profile-form__label">Color</label>
              <input class="profile-form__input" [(ngModel)]="vehicleForm.car_color" />
            </div>
          </div>
          <div class="profile-form__field">
            <label class="profile-form__label">License Plate</label>
            <input class="profile-form__input" [(ngModel)]="vehicleForm.license_plate" />
          </div>
          <button class="profile-form__btn" (click)="onSave()" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

        <div class="profile-section">
          <button class="profile-form__btn profile-form__btn--back" (click)="goToApp()">
            &larr; Switch to Passenger Mode
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .driver-page { padding: 24px 20px; max-width: 600px; margin: 0 auto; }
    .driver-page__title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 24px; }

    .profile-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .profile-card__header { display: flex; align-items: center; gap: 16px; }
    .profile-card__avatar { width: 56px; height: 56px; border-radius: 50%; background: #f5a623; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
    .profile-card__name { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .profile-card__email { font-size: 14px; color: #718096; margin: 4px 0 0; }
    .profile-card__rating { font-size: 14px; color: #f5a623; margin: 4px 0 0; font-weight: 600; }

    .profile-section { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
    .profile-section__title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }

    .profile-form__row { display: flex; gap: 12px; }
    .profile-form__field { flex: 1; margin-bottom: 14px; }
    .profile-form__label { display: block; font-size: 13px; font-weight: 600; color: #718096; margin-bottom: 6px; }
    .profile-form__input { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #333; box-sizing: border-box; }
    .profile-form__input:focus { outline: none; border-color: #f5a623; }

    .profile-form__btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; background: #f5a623; color: #fff; transition: opacity 0.2s; }
    .profile-form__btn:hover:not(:disabled) { opacity: 0.85; }
    .profile-form__btn:disabled { opacity: 0.5; }
    .profile-form__btn--back { background: #e2e8f0; color: #4a5568; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly portal = inject(DriverPortalService);
  private readonly router = inject(Router);
  readonly isSaving = signal(false);

  vehicleForm = {
    car_make: '', car_model: '', car_year: 2024, car_color: '', license_plate: '',
  };

  async ngOnInit() {
    const clerkId = this.auth.user()?.id;
    if (!clerkId) return;
    await this.portal.loadProfile(clerkId);
    const p = this.portal.profile();
    if (p) {
      this.vehicleForm = {
        car_make: p.car_make || '',
        car_model: p.car_model || '',
        car_year: p.car_year || 2024,
        car_color: p.car_color || '',
        license_plate: p.license_plate || '',
      };
    }
  }

  async onSave() {
    const clerkId = this.auth.user()?.id;
    if (!clerkId) return;
    this.isSaving.set(true);
    try {
      await this.portal.updateProfile(clerkId, this.vehicleForm);
    } finally {
      this.isSaving.set(false);
    }
  }

  goToApp() {
    this.router.navigate(['/app/home']);
  }
}
