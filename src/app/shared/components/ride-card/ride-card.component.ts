import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import type { Ride } from '../../models/ride.model';
import { formatDate, formatTime } from '../../utils/format';
import { environment } from '@env';

@Component({
  selector: 'app-ride-card',
  template: `
    <div class="ride-card">
      <div class="ride-card__header">
        <img [src]="mapUrl()" class="ride-card__map-img" alt="Map" />

        <div class="ride-card__locations">
          <div class="ride-card__location">
            <img src="assets/icons/to.png" class="ride-card__icon" alt="From" />
            <span class="ride-card__address">{{ ride().origin_address }}</span>
          </div>
          <div class="ride-card__location">
            <img src="assets/icons/point.png" class="ride-card__icon" alt="To" />
            <span class="ride-card__address">{{ ride().destination_address }}</span>
          </div>
        </div>
      </div>

      <div class="ride-card__details">
        <div class="ride-card__row">
          <span class="ride-card__label">Date & Time</span>
          <span class="ride-card__value">{{ format(ride().created_at) }}, {{ formatTimeDisplay(ride().ride_time) }}</span>
        </div>

        <div class="ride-card__row">
          <span class="ride-card__label">Driver</span>
          <span class="ride-card__value">{{ ride().driver.first_name }} {{ ride().driver.last_name }}</span>
        </div>

        <div class="ride-card__row">
          <span class="ride-card__label">Car Seats</span>
          <span class="ride-card__value">{{ ride().driver.car_seats }}</span>
        </div>

        <div class="ride-card__row">
          <span class="ride-card__label">Status</span>
          <span class="ride-card__value ride-card__value--status"
                [class.text-green]="ride().status === 'completed'"
                [class.text-yellow]="ride().status === 'pending' || ride().status === 'accepted'"
                [class.text-blue]="ride().status === 'in_progress' || ride().status === 'en_route_pickup' || ride().status === 'arrived_pickup'"
                [class.text-red]="ride().status === 'cancelled' || ride().status === 'driver_cancelled'">
            {{ statusLabel() }}
          </span>
        </div>

        <div class="ride-card__row">
          <span class="ride-card__label">Payment</span>
          <span class="ride-card__value ride-card__value--status"
                [class.text-green]="ride().payment_status === 'paid'"
                [class.text-red]="ride().payment_status !== 'paid'">
            {{ ride().payment_status }}
          </span>
        </div>
      </div>

      @if (canCancel()) {
        <button class="ride-card__cancel-btn" (click)="cancelRide.emit(ride().ride_id!)">
          Cancel Ride
        </button>
      }
    </div>
  `,
  styleUrl: './ride-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideCardComponent {
  readonly ride = input.required<Ride>();
  readonly cancelRide = output<number>();

  readonly canCancel = computed(() => this.ride().status === 'pending');

  readonly statusLabel = computed(() => {
    const labels: Record<string, string> = {
      pending: 'Pending', accepted: 'Accepted', en_route_pickup: 'Driver En Route',
      arrived_pickup: 'Driver Arrived', in_progress: 'In Progress',
      completed: 'Completed', cancelled: 'Cancelled', driver_cancelled: 'Driver Cancelled',
    };
    return labels[this.ride().status] || this.ride().status;
  });

  readonly mapUrl = computed(() => {
    const lat = this.ride().destination_latitude;
    const lng = this.ride().destination_longitude;
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${lng},${lat}&zoom=14&apiKey=${environment.geoapifyApiKey}`;
  });

  format(dateStr: string) { return formatDate(dateStr); }
  formatTimeDisplay(time: number) { return formatTime(time); }
}
