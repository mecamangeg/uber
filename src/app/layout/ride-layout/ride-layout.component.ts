import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { BottomSheetComponent } from '../../shared/components/bottom-sheet/bottom-sheet.component';
import { MapComponent } from '../../shared/components/map/map.component';

@Component({
  selector: 'app-ride-layout',
  imports: [BottomSheetComponent, MapComponent],
  template: `
    <div class="ride-layout">
      <div class="ride-layout__header">
        <button class="ride-layout__back-btn" (click)="goBack()" aria-label="Go back">
          <img src="assets/icons/back-arrow.png" class="ride-layout__back-icon" alt="" />
        </button>
        <span class="ride-layout__title">{{ title() || 'Go Back' }}</span>
      </div>

      <div class="ride-layout__map-container">
        <app-map></app-map>
      </div>

      <app-bottom-sheet>
        <ng-content></ng-content>
      </app-bottom-sheet>
    </div>
  `,
  styleUrl: './ride-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideLayoutComponent {
  readonly title = input.required<string>();

  goBack() {
    window.history.back();
  }
}
