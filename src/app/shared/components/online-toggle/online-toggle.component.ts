import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-online-toggle',
  template: `
    <button class="online-toggle" [class.online-toggle--active]="isOnline()" (click)="toggle.emit()">
      <span class="online-toggle__dot"></span>
      <span class="online-toggle__label">{{ isOnline() ? 'Online' : 'Offline' }}</span>
    </button>
  `,
  styles: [`
    .online-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 24px;
      border-radius: 50px;
      border: 2px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
      font-size: 16px;
      font-weight: 700;
      color: #718096;
      transition: all 0.3s;
    }
    .online-toggle--active {
      background: #48bb78;
      border-color: #48bb78;
      color: #fff;
    }
    .online-toggle__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #cbd5e0;
      transition: background 0.3s;
    }
    .online-toggle--active .online-toggle__dot {
      background: #fff;
      box-shadow: 0 0 8px rgba(255,255,255,0.6);
    }
    .online-toggle__label {
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnlineToggleComponent {
  readonly isOnline = input.required<boolean>();
  readonly toggle = output<void>();
}
