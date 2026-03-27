import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { DriverPortalService } from '@core/services/driver-portal.service';

@Component({
  selector: 'app-driver-rides',
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="driver-page">
      <h2 class="driver-page__title">Ride History</h2>

      @if (portal.isLoading()) {
        <div class="driver-page__loading"><div class="spinner"></div></div>
      } @else if (portal.rideHistory().length === 0) {
        <div class="driver-page__empty"><p>No completed rides yet.</p></div>
      } @else {
        <div class="ride-list">
          @for (ride of portal.rideHistory(); track ride.ride_id) {
            <div class="ride-item">
              <div class="ride-item__route">
                <div class="ride-item__address">{{ ride.origin_address }}</div>
                <span class="ride-item__arrow">&rarr;</span>
                <div class="ride-item__address">{{ ride.destination_address }}</div>
              </div>
              <div class="ride-item__meta">
                <span>{{ ride.created_at | date:'mediumDate' }}</span>
                <span class="ride-item__fare">PHP {{ ride.fare_price | number:'1.2-2' }}</span>
                <span class="ride-item__status" [class]="'ride-item__status--' + ride.status">{{ ride.status }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .driver-page { padding: 24px 20px; max-width: 600px; margin: 0 auto; }
    .driver-page__title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 24px; }
    .driver-page__loading { display: flex; justify-content: center; padding: 48px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #f5a623; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .driver-page__empty { text-align: center; padding: 48px; color: #999; background: #fff; border-radius: 12px; }
    .ride-list { display: flex; flex-direction: column; gap: 12px; }
    .ride-item { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .ride-item__route { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .ride-item__address { font-size: 14px; color: #333; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ride-item__arrow { color: #718096; font-size: 16px; }
    .ride-item__meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #718096; }
    .ride-item__fare { font-weight: 700; color: #1a1a2e; font-family: monospace; }
    .ride-item__status { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .ride-item__status--completed { background: #c6f6d5; color: #22543d; }
    .ride-item__status--cancelled, .ride-item__status--driver_cancelled { background: #fed7d7; color: #9b2c2c; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverRidesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly portal = inject(DriverPortalService);

  async ngOnInit() {
    const clerkId = this.auth.user()?.id;
    if (!clerkId) return;
    await this.portal.loadProfile(clerkId);
    const profile = this.portal.profile();
    if (profile) this.portal.loadRideHistory(profile.id);
  }
}
