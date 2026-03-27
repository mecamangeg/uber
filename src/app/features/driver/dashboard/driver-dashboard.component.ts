import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { DriverPortalService } from '@core/services/driver-portal.service';
import { OnlineToggleComponent } from '@shared/components/online-toggle/online-toggle.component';
import { EarningsCardComponent } from '@shared/components/earnings-card/earnings-card.component';

@Component({
  selector: 'app-driver-dashboard',
  imports: [DecimalPipe, OnlineToggleComponent, EarningsCardComponent],
  template: `
    <div class="driver-dash">
      <div class="driver-dash__header">
        <h2 class="driver-dash__greeting">
          Hello, {{ portal.profile()?.first_name || 'Driver' }}
        </h2>
        <app-online-toggle
          [isOnline]="portal.profile()?.is_online ?? false"
          (toggle)="onToggleOnline()" />
      </div>

      <div class="driver-dash__stats">
        <app-earnings-card label="Today" [amount]="portal.earnings().today" />
        <app-earnings-card label="This Week" [amount]="portal.earnings().week" />
        <app-earnings-card label="Total" [amount]="portal.earnings().total" />
      </div>

      <div class="driver-dash__info-row">
        <div class="driver-dash__stat-chip">
          <span class="driver-dash__stat-value">{{ portal.profile()?.rating || 0 }}</span>
          <span class="driver-dash__stat-label">Rating</span>
        </div>
        <div class="driver-dash__stat-chip">
          <span class="driver-dash__stat-value">{{ portal.profile()?.total_rides_completed || 0 }}</span>
          <span class="driver-dash__stat-label">Rides</span>
        </div>
      </div>

      @if (portal.profile()?.is_online) {
        @if (portal.activeRide(); as ride) {
          <div class="driver-dash__ride-alert">
            <h3 class="driver-dash__ride-title">Incoming Ride Request</h3>
            <div class="driver-dash__ride-detail">
              <span class="driver-dash__ride-label">From:</span>
              <span>{{ ride.origin_address }}</span>
            </div>
            <div class="driver-dash__ride-detail">
              <span class="driver-dash__ride-label">To:</span>
              <span>{{ ride.destination_address }}</span>
            </div>
            <div class="driver-dash__ride-detail">
              <span class="driver-dash__ride-label">Fare:</span>
              <span class="driver-dash__ride-fare">PHP {{ ride.fare_price | number:'1.2-2' }}</span>
            </div>
            @if (ride.customer) {
              <div class="driver-dash__ride-detail">
                <span class="driver-dash__ride-label">Passenger:</span>
                <span>{{ ride.customer.name }}</span>
              </div>
            }
            <div class="driver-dash__ride-actions">
              <button class="driver-dash__btn driver-dash__btn--accept" (click)="onAcceptRide()">Accept</button>
              <button class="driver-dash__btn driver-dash__btn--decline" (click)="onDeclineRide()">Decline</button>
            </div>
          </div>
        } @else {
          <div class="driver-dash__waiting">
            <div class="driver-dash__pulse"></div>
            <p class="driver-dash__waiting-text">Waiting for ride requests...</p>
          </div>
        }
      } @else {
        <div class="driver-dash__offline-msg">
          <p>Go online to start receiving ride requests</p>
        </div>
      }
    </div>
  `,
  styleUrl: './driver-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverDashboardComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  readonly portal = inject(DriverPortalService);
  private readonly router = inject(Router);
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  async ngOnInit() {
    const clerkId = this.auth.user()?.id;
    if (!clerkId) return;

    await this.portal.loadProfile(clerkId);
    const profile = this.portal.profile();
    if (profile) {
      this.portal.loadEarnings(profile.id);
      if (profile.is_online) {
        this.startPolling(profile.id);
      }
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  async onToggleOnline() {
    const clerkId = this.auth.user()?.id;
    const profile = this.portal.profile();
    if (!clerkId || !profile) return;

    const goOnline = !profile.is_online;

    if (goOnline && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await this.portal.toggleOnline(clerkId, true, pos.coords.latitude, pos.coords.longitude);
          this.startPolling(profile.id);
        },
        async () => {
          await this.portal.toggleOnline(clerkId, true);
          this.startPolling(profile.id);
        }
      );
    } else {
      await this.portal.toggleOnline(clerkId, false);
      this.stopPolling();
    }
  }

  async onAcceptRide() {
    const ride = this.portal.activeRide();
    const profile = this.portal.profile();
    if (!ride || !profile) return;
    await this.portal.updateRideStatus(ride.ride_id, 'accepted', String(profile.id));
    this.router.navigate(['/driver/active-ride']);
  }

  async onDeclineRide() {
    const ride = this.portal.activeRide();
    const profile = this.portal.profile();
    if (!ride || !profile) return;
    await this.portal.updateRideStatus(ride.ride_id, 'driver_cancelled', String(profile.id));
    this.portal.activeRide.set(null);
  }

  private startPolling(driverId: number) {
    this.stopPolling();
    this.portal.loadActiveRide(driverId);
    this.pollInterval = setInterval(() => {
      this.portal.loadActiveRide(driverId);
    }, 5000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
