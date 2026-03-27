import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
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
          <span class="ride-card__label">Payment Status</span>
          <span class="ride-card__value ride-card__value--status" 
                [class.text-green]="ride().payment_status === 'paid'"
                [class.text-red]="ride().payment_status !== 'paid'">
            {{ ride().payment_status }}
          </span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './ride-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideCardComponent {
  readonly ride = input.required<Ride>();

  readonly mapUrl = computed(() => {
    const lat = this.ride().destination_latitude;
    const lng = this.ride().destination_longitude;
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${lng},${lat}&zoom=14&apiKey=${environment.geoapifyApiKey}`;
  });

  format(dateStr: string) { return formatDate(dateStr); }
  formatTimeDisplay(time: number) { return formatTime(time); }
}
