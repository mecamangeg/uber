import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '@core/services/admin.service';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import type { Driver } from '@models/driver.model';

@Component({
  selector: 'app-admin-drivers',
  imports: [DecimalPipe, ReactiveFormsModule, CustomButtonComponent],
  template: `
    <div class="admin-page">
      <div class="admin-page__header">
        <h2 class="admin-page__title">Drivers</h2>
        <app-custom-button title="Add Driver" bgVariant="primary" (pressed)="openForm()" />
      </div>

      <!-- Driver Form Modal -->
      @if (showForm()) {
        <div class="modal-backdrop" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">{{ editingId() ? 'Edit Driver' : 'Add Driver' }}</h3>

            <form [formGroup]="form" class="driver-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">First Name</label>
                  <input formControlName="first_name" class="form-input" placeholder="e.g. Carlos" />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name</label>
                  <input formControlName="last_name" class="form-input" placeholder="e.g. Santos" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Profile Image URL</label>
                  <input formControlName="profile_image_url" class="form-input" placeholder="https://..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Car Image URL</label>
                  <input formControlName="car_image_url" class="form-input" placeholder="https://..." />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Car Seats</label>
                  <input formControlName="car_seats" class="form-input" type="number" min="1" max="12" />
                </div>
                <div class="form-group">
                  <label class="form-label">Rating</label>
                  <input formControlName="rating" class="form-input" type="number" min="1" max="5" step="0.1" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input formControlName="latitude" class="form-input" type="number" step="0.0000001" />
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input formControlName="longitude" class="form-input" type="number" step="0.0000001" />
                </div>
              </div>

              @if (formError()) {
                <p class="form-error">{{ formError() }}</p>
              }

              <div class="modal__actions">
                <app-custom-button title="Cancel" bgVariant="outline" (pressed)="closeForm()" />
                <app-custom-button
                  [title]="saving() ? 'Saving...' : (editingId() ? 'Update' : 'Create')"
                  bgVariant="primary"
                  [disabled]="saving() || form.invalid"
                  (pressed)="onSubmit()"
                />
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Drivers Table -->
      @if (admin.isLoading()) {
        <div class="admin-loading"><div class="spinner"></div></div>
      } @else if (admin.drivers().length === 0) {
        <div class="admin-empty">
          <p>No drivers registered yet. Click "Add Driver" to get started.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Seats</th>
                <th>Rating</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (driver of admin.drivers(); track driver.id) {
                <tr>
                  <td>{{ driver.id }}</td>
                  <td class="cell-name">
                    @if (driver.profile_image_url) {
                      <img [src]="driver.profile_image_url" class="avatar" alt="" />
                    }
                    {{ driver.first_name }} {{ driver.last_name }}
                  </td>
                  <td>{{ driver.car_seats }}</td>
                  <td><span class="badge badge--rating">{{ driver.rating }}</span></td>
                  <td class="cell-muted">
                    @if (driver.latitude && driver.longitude) {
                      {{ driver.latitude | number:'1.4-4' }}, {{ driver.longitude | number:'1.4-4' }}
                    } @else {
                      --
                    }
                  </td>
                  <td class="cell-actions">
                    <button class="action-btn action-btn--edit" (click)="editDriver(driver)" aria-label="Edit driver">Edit</button>
                    <button class="action-btn action-btn--delete" (click)="confirmDelete(driver)" aria-label="Delete driver">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Delete confirmation -->
      @if (deletingDriver()) {
        <div class="modal-backdrop" (click)="deletingDriver.set(null)">
          <div class="modal modal--sm" (click)="$event.stopPropagation()">
            <h3 class="modal__title">Delete Driver</h3>
            <p>Are you sure you want to delete <strong>{{ deletingDriver()!.first_name }} {{ deletingDriver()!.last_name }}</strong>?</p>
            <div class="modal__actions">
              <app-custom-button title="Cancel" bgVariant="outline" (pressed)="deletingDriver.set(null)" />
              <app-custom-button title="Delete" bgVariant="danger" (pressed)="onDelete()" />
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-drivers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminDriversComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly admin = inject(AdminService);

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly deletingDriver = signal<Driver | null>(null);

  readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    profile_image_url: [''],
    car_image_url: [''],
    car_seats: [4, [Validators.required, Validators.min(1), Validators.max(12)]],
    rating: [4.5, [Validators.required, Validators.min(1), Validators.max(5)]],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  ngOnInit() {
    this.admin.loadDrivers();
  }

  openForm() {
    this.editingId.set(null);
    this.form.reset({ first_name: '', last_name: '', profile_image_url: '', car_image_url: '', car_seats: 4, rating: 4.5, latitude: null, longitude: null });
    this.formError.set('');
    this.showForm.set(true);
  }

  editDriver(driver: Driver) {
    this.editingId.set(driver.id);
    this.form.patchValue({
      first_name: driver.first_name,
      last_name: driver.last_name,
      profile_image_url: driver.profile_image_url,
      car_image_url: driver.car_image_url,
      car_seats: driver.car_seats,
      rating: driver.rating,
      latitude: driver.latitude ?? null,
      longitude: driver.longitude ?? null,
    });
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  async onSubmit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.formError.set('');

    try {
      const data = this.form.getRawValue() as Omit<Driver, 'id'>;
      if (this.editingId()) {
        await this.admin.updateDriver(this.editingId()!, data);
      } else {
        await this.admin.createDriver(data);
      }
      this.closeForm();
    } catch (e) {
      this.formError.set('Failed to save driver. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(driver: Driver) {
    this.deletingDriver.set(driver);
  }

  async onDelete() {
    const driver = this.deletingDriver();
    if (!driver) return;
    try {
      await this.admin.deleteDriver(driver.id);
    } catch (e) {
      console.error('Delete failed:', e);
    }
    this.deletingDriver.set(null);
  }
}
