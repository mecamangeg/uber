import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { RideLayoutComponent } from '../../../layout/ride-layout/ride-layout.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { AuthService } from '@core/services/auth.service';
import { DriverService } from '@core/services/driver.service';
import { LocationService } from '@core/services/location.service';
import { RideService } from '@core/services/ride.service';
import { PaymentService } from '@core/services/payment.service';
import { formatTime } from '@shared/utils/format';

@Component({
  selector: 'app-book-ride',
  imports: [RideLayoutComponent, CustomButtonComponent],
  template: `
    <app-ride-layout title="Book Ride">
      @if (driver(); as d) {
        <h3 class="book-ride__heading">Ride Information</h3>

        <div class="book-ride__driver">
          <img [src]="d.profile_image_url" class="book-ride__driver-img" alt="Driver" />
          <div class="book-ride__driver-name-row">
            <span class="book-ride__driver-name">{{ d.title }}</span>
            <span class="book-ride__driver-rating">
              <img src="assets/icons/star.png" class="book-ride__icon-sm" alt="Star" />
              {{ d.rating }}
            </span>
          </div>
        </div>

        <div class="book-ride__info-card">
          <div class="book-ride__info-row book-ride__info-row--border">
            <span>Ride Price</span>
            <span class="book-ride__price">\${{ d.price }}</span>
          </div>
          <div class="book-ride__info-row book-ride__info-row--border">
            <span>Pickup Time</span>
            <span>{{ formatTimeDisplay(d.time || 0) }}</span>
          </div>
          <div class="book-ride__info-row">
            <span>Car Seats</span>
            <span>{{ d.car_seats }}</span>
          </div>
        </div>

        <div class="book-ride__locations">
          <div class="book-ride__loc-row book-ride__loc-row--border">
            <img src="assets/icons/to.png" class="book-ride__loc-icon" alt="From" />
            <span>{{ location.userAddress() }}</span>
          </div>
          <div class="book-ride__loc-row">
            <img src="assets/icons/point.png" class="book-ride__loc-icon" alt="To" />
            <span>{{ location.destinationAddress() }}</span>
          </div>
        </div>

        <div class="book-ride__action">
          @if (payment.paymentStatus() === 'paid') {
            <app-custom-button title="Ride Booked!" bgVariant="success" [disabled]="true" />
          } @else {
            <app-custom-button
              title="Book Ride"
              [disabled]="payment.isProcessing()"
              (pressed)="bookRide()"
            />
          }
        </div>
      }
    </app-ride-layout>
  `,
  styleUrl: './book-ride.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BookRideComponent {
  private readonly auth = inject(AuthService);
  private readonly driverService = inject(DriverService);
  readonly location = inject(LocationService);
  private readonly rideService = inject(RideService);
  readonly payment = inject(PaymentService);
  private readonly router = inject(Router);

  readonly driver = computed(() => {
    const selectedId = this.driverService.selectedDriver();
    return this.driverService.drivers().find(d => d.id === selectedId) ?? null;
  });

  formatTimeDisplay(time: number) {
    return formatTime(time);
  }

  async bookRide() {
    const d = this.driver();
    const user = this.auth.user();
    if (!d || !user) return;

    try {
      const ride = await this.rideService.createRide({
        origin_address: this.location.userAddress() || '',
        destination_address: this.location.destinationAddress() || '',
        origin_latitude: this.location.userLatitude() || 0,
        origin_longitude: this.location.userLongitude() || 0,
        destination_latitude: this.location.destinationLatitude() || 0,
        destination_longitude: this.location.destinationLongitude() || 0,
        ride_time: d.time || 0,
        fare_price: parseFloat(d.price || '0'),
        payment_status: 'pending',
        driver_id: d.id,
        user_id: user.id,
      });

      const refId = await this.payment.payForRide(ride.ride_id!, ride.fare_price);
      await this.payment.confirmPayment(refId);
    } catch (e) {
      console.error('Booking failed:', e);
    }
  }
}
