import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import type { MarkerData } from '../../models/driver.model';
import { formatTime } from '../../utils/format';

@Component({
  selector: 'app-driver-card',
  template: `
    <button
      class="driver-card"
      [class.driver-card--selected]="selected()"
      (click)="select.emit()">
      <img [src]="item().profile_image_url" class="driver-card__profile" alt="Driver profile" />

      <div class="driver-card__content">
        <div class="driver-card__header">
          <span class="driver-card__title">{{ item().title }}</span>
          <div class="driver-card__rating">
            <img src="assets/icons/star.png" class="driver-card__icon-sm" alt="Star" />
            <span class="driver-card__text-sm">4</span>
          </div>
        </div>

        <div class="driver-card__details">
          <div class="driver-card__price">
            <img src="assets/icons/dollar.png" class="driver-card__icon-sm" alt="Dollar" />
            <span class="driver-card__text-sm">{{ item().price }}</span>
          </div>
          <span class="driver-card__separator">|</span>
          <span class="driver-card__text-sm">{{ format(item().time || 0) }}</span>
          <span class="driver-card__separator">|</span>
          <span class="driver-card__text-sm">{{ item().car_seats }} seats</span>
        </div>
      </div>

      <img [src]="item().car_image_url" class="driver-card__car" alt="Car" />
    </button>
  `,
  styleUrl: './driver-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverCardComponent {
  readonly item = input.required<MarkerData>();
  readonly selected = input<boolean>(false);
  readonly select = output<void>();

  format(time: number) {
    return formatTime(time);
  }
}
