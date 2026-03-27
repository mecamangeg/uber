import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleTextInputComponent } from '@shared/components/google-text-input/google-text-input.component';
import { MapComponent } from '@shared/components/map/map.component';
import { RideCardComponent } from '@shared/components/ride-card/ride-card.component';
import { AuthService } from '@core/services/auth.service';
import { LocationService } from '@core/services/location.service';
import { RideService } from '@core/services/ride.service';
import type { LocationCoordinates } from '@models/location.model';

@Component({
  selector: 'app-home',
  imports: [GoogleTextInputComponent, MapComponent, RideCardComponent],
  template: `
    <div class="home">
      <div class="home__header">
        <h2 class="home__greeting">
          Welcome {{ firstName() }}
        </h2>
        <button class="home__sign-out" (click)="signOut()" aria-label="Sign out">
          <img src="assets/icons/out.png" class="home__sign-out-icon" alt="" />
        </button>
      </div>

      <app-google-text-input
        icon="assets/icons/search.png"
        (locationSelected)="onDestinationSelected($event)"
      />

      <h3 class="home__section-title">Your current location</h3>
      <div class="home__map-container">
        <app-map />
      </div>

      <h3 class="home__section-title">Recent Rides</h3>

      @if (rideService.isLoading()) {
        <div class="home__empty">
          <div class="spinner"></div>
        </div>
      } @else if (recentRides().length === 0) {
        <div class="home__empty">
          <img src="assets/images/no-result.png" class="home__empty-img" alt="No rides" />
          <p class="home__empty-text">No recent rides found</p>
        </div>
      } @else {
        @for (ride of recentRides(); track ride.ride_id) {
          <app-ride-card [ride]="ride" />
        }
      }
    </div>
  `,
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly location = inject(LocationService);
  readonly rideService = inject(RideService);
  private readonly router = inject(Router);

  readonly firstName = signal('');
  readonly recentRides = signal<any[]>([]);

  ngOnInit() {
    const user = this.auth.user();
    this.firstName.set(user?.firstName ?? '');

    this.location.requestCurrentLocation();

    if (user?.id) {
      this.rideService.loadRides(user.id).then(() => {
        this.recentRides.set(this.rideService.recentRides().slice(0, 5));
      });
    }
  }

  onDestinationSelected(loc: LocationCoordinates) {
    this.location.setDestinationLocation(loc);
    this.router.navigate(['/app/find-ride']);
  }

  signOut() {
    this.auth.signOut();
    this.router.navigate(['/auth/sign-in']);
  }
}
