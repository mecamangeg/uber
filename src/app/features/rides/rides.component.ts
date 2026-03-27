import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RideCardComponent } from '@shared/components/ride-card/ride-card.component';
import { AuthService } from '@core/services/auth.service';
import { RideService } from '@core/services/ride.service';

@Component({
  selector: 'app-rides',
  imports: [RideCardComponent],
  template: `
    <div class="rides">
      <h2 class="rides__title">All Rides</h2>

      @if (rideService.isLoading()) {
        <div class="rides__empty">
          <div class="spinner"></div>
        </div>
      } @else if (rideService.recentRides().length === 0) {
        <div class="rides__empty">
          <img src="assets/images/no-result.png" class="rides__empty-img" alt="No rides" />
          <p class="rides__empty-text">No recent rides found</p>
        </div>
      } @else {
        @for (ride of rideService.recentRides(); track ride.ride_id) {
          <app-ride-card [ride]="ride" (cancelRide)="onCancelRide($event)" />
        }
      }
    </div>
  `,
  styleUrl: './rides.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RidesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly rideService = inject(RideService);

  ngOnInit() {
    const user = this.auth.user();
    if (user?.id) {
      this.rideService.loadRides(user.id);
    }
  }

  async onCancelRide(rideId: number) {
    if (!confirm('Are you sure you want to cancel this ride?')) return;
    const user = this.auth.user();
    await this.rideService.cancelRide(rideId, 'customer', user?.id || '');
  }
}
