import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { DriverPortalService } from '@core/services/driver-portal.service';
import type { RideStatus } from '@models/ride.model';

const STATUS_STEPS: { status: RideStatus; label: string; action: string }[] = [
  { status: 'accepted', label: 'Accepted', action: 'Navigate to Pickup' },
  { status: 'en_route_pickup', label: 'En Route', action: "I've Arrived" },
  { status: 'arrived_pickup', label: 'Arrived', action: 'Start Trip' },
  { status: 'in_progress', label: 'In Progress', action: 'Complete Trip' },
];

@Component({
  selector: 'app-driver-active-ride',
  imports: [DecimalPipe],
  template: `
    <div class="active-ride">
      @if (portal.activeRide(); as ride) {
        <div class="active-ride__card">
          <h2 class="active-ride__title">Active Ride</h2>

          <div class="active-ride__stepper">
            @for (s of steps; track s.status; let i = $index) {
              <div class="stepper__item" [class.stepper__item--done]="stepIndex(ride.status) > i" [class.stepper__item--current]="stepIndex(ride.status) === i">
                <div class="stepper__dot"></div>
                <span class="stepper__label">{{ s.label }}</span>
              </div>
            }
          </div>

          <div class="active-ride__info">
            <div class="active-ride__row">
              <span class="active-ride__label">Pickup</span>
              <span class="active-ride__value">{{ ride.origin_address }}</span>
            </div>
            <div class="active-ride__row">
              <span class="active-ride__label">Destination</span>
              <span class="active-ride__value">{{ ride.destination_address }}</span>
            </div>
            <div class="active-ride__row">
              <span class="active-ride__label">Fare</span>
              <span class="active-ride__value active-ride__value--fare">PHP {{ ride.fare_price | number:'1.2-2' }}</span>
            </div>
            @if (ride.customer) {
              <div class="active-ride__row">
                <span class="active-ride__label">Passenger</span>
                <span class="active-ride__value">{{ ride.customer.name }}</span>
              </div>
            }
          </div>

          @if (nextAction(); as action) {
            <button class="active-ride__btn active-ride__btn--primary" (click)="onAdvance()">
              {{ action }}
            </button>
          }

          @if (canCancel(ride.status)) {
            <button class="active-ride__btn active-ride__btn--cancel" (click)="onCancel()">
              Cancel Ride
            </button>
          }
        </div>
      } @else {
        <div class="active-ride__empty">
          <p>No active ride</p>
          <button class="active-ride__btn active-ride__btn--back" (click)="goBack()">Back to Dashboard</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .active-ride { padding: 24px 20px; max-width: 600px; margin: 0 auto; }
    .active-ride__card { background: #fff; border-radius: 16px; padding: 28px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .active-ride__title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 20px; }

    /* Stepper */
    .active-ride__stepper { display: flex; align-items: center; gap: 4px; margin-bottom: 24px; }
    .stepper__item { display: flex; align-items: center; gap: 6px; flex: 1; }
    .stepper__dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #e2e8f0; background: #fff; flex-shrink: 0; transition: all 0.3s; }
    .stepper__item--done .stepper__dot { background: #48bb78; border-color: #48bb78; }
    .stepper__item--current .stepper__dot { background: #f5a623; border-color: #f5a623; }
    .stepper__label { font-size: 11px; font-weight: 600; color: #a0aec0; }
    .stepper__item--done .stepper__label { color: #48bb78; }
    .stepper__item--current .stepper__label { color: #f5a623; }

    /* Info */
    .active-ride__info { background: #f7fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .active-ride__row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
    .active-ride__row:last-child { margin-bottom: 0; }
    .active-ride__label { font-size: 13px; font-weight: 600; color: #718096; min-width: 80px; }
    .active-ride__value { font-size: 14px; color: #333; text-align: right; flex: 1; }
    .active-ride__value--fare { font-weight: 800; color: #48bb78; }

    /* Buttons */
    .active-ride__btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; margin-top: 12px; }
    .active-ride__btn:hover { opacity: 0.85; }
    .active-ride__btn--primary { background: #48bb78; color: #fff; }
    .active-ride__btn--cancel { background: #fed7d7; color: #9b2c2c; }
    .active-ride__btn--back { background: #e2e8f0; color: #4a5568; }

    .active-ride__empty { text-align: center; padding: 64px 24px; color: #718096; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverActiveRideComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly portal = inject(DriverPortalService);
  private readonly router = inject(Router);

  readonly steps = STATUS_STEPS;

  async ngOnInit() {
    const clerkId = this.auth.user()?.id;
    if (!clerkId) return;
    await this.portal.loadProfile(clerkId);
    const profile = this.portal.profile();
    if (profile) this.portal.loadActiveRide(profile.id);
  }

  stepIndex(status: string): number {
    const idx = STATUS_STEPS.findIndex(s => s.status === status);
    return idx >= 0 ? idx : -1;
  }

  nextAction(): string | null {
    const ride = this.portal.activeRide();
    if (!ride) return null;
    const step = STATUS_STEPS.find(s => s.status === ride.status);
    return step?.action || null;
  }

  canCancel(status: string): boolean {
    return status === 'accepted' || status === 'en_route_pickup';
  }

  async onAdvance() {
    const ride = this.portal.activeRide();
    const profile = this.portal.profile();
    if (!ride || !profile) return;

    const transitions: Record<string, RideStatus> = {
      accepted: 'en_route_pickup',
      en_route_pickup: 'arrived_pickup',
      arrived_pickup: 'in_progress',
      in_progress: 'completed',
    };

    const nextStatus = transitions[ride.status];
    if (!nextStatus) return;

    await this.portal.updateRideStatus(ride.ride_id, nextStatus, String(profile.id));

    if (nextStatus === 'completed') {
      this.portal.activeRide.set(null);
      this.router.navigate(['/driver/dashboard']);
    } else {
      await this.portal.loadActiveRide(profile.id);
    }
  }

  async onCancel() {
    if (!confirm('Cancel this ride?')) return;
    const ride = this.portal.activeRide();
    const profile = this.portal.profile();
    if (!ride || !profile) return;
    await this.portal.updateRideStatus(ride.ride_id, 'driver_cancelled', String(profile.id));
    this.portal.activeRide.set(null);
    this.router.navigate(['/driver/dashboard']);
  }

  goBack() {
    this.router.navigate(['/driver/dashboard']);
  }
}
