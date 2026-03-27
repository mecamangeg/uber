import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RideLayoutComponent } from '../../../layout/ride-layout/ride-layout.component';
import { GoogleTextInputComponent } from '@shared/components/google-text-input/google-text-input.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { LocationService } from '@core/services/location.service';
import type { LocationCoordinates } from '@models/location.model';

@Component({
  selector: 'app-find-ride',
  imports: [RideLayoutComponent, GoogleTextInputComponent, CustomButtonComponent],
  template: `
    <app-ride-layout title="Ride">
      <div class="find-ride__field">
        <h3 class="find-ride__label">From</h3>
        <app-google-text-input
          icon="assets/icons/target.png"
          [initialLocation]="location.userAddress()"
          (locationSelected)="onFromSelected($event)"
        />
      </div>

      <div class="find-ride__field">
        <h3 class="find-ride__label">To</h3>
        <app-google-text-input
          icon="assets/icons/map.png"
          [initialLocation]="location.destinationAddress()"
          (locationSelected)="onToSelected($event)"
        />
      </div>

      <div class="find-ride__action">
        <app-custom-button title="Find Now" (pressed)="findRide()" />
      </div>
    </app-ride-layout>
  `,
  styleUrl: './find-ride.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FindRideComponent {
  readonly location = inject(LocationService);
  private readonly router = inject(Router);

  onFromSelected(loc: LocationCoordinates) {
    this.location.setUserLocation(loc);
  }

  onToSelected(loc: LocationCoordinates) {
    this.location.setDestinationLocation(loc);
  }

  findRide() {
    this.router.navigate(['/app/confirm-ride']);
  }
}
