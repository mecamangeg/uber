import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RideLayoutComponent } from '../../../layout/ride-layout/ride-layout.component';
import { DriverCardComponent } from '@shared/components/driver-card/driver-card.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { DriverService } from '@core/services/driver.service';

@Component({
  selector: 'app-confirm-ride',
  imports: [RideLayoutComponent, DriverCardComponent, CustomButtonComponent],
  template: `
    <app-ride-layout title="Choose a Rider">
      @for (driver of driverService.drivers(); track driver.id) {
        <app-driver-card
          [item]="driver"
          [selected]="driverService.selectedDriver() === driver.id"
          (select)="driverService.selectDriver(driver.id)"
        />
      }

      <div class="confirm-ride__action">
        <app-custom-button title="Select Ride" (pressed)="selectRide()" />
      </div>
    </app-ride-layout>
  `,
  styleUrl: './confirm-ride.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ConfirmRideComponent implements OnInit {
  readonly driverService = inject(DriverService);
  private readonly router = inject(Router);

  ngOnInit() {
    this.driverService.loadDrivers();
  }

  selectRide() {
    this.router.navigate(['/app/book-ride']);
  }
}
