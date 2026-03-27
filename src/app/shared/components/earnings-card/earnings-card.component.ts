import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-earnings-card',
  imports: [DecimalPipe],
  template: `
    <div class="earnings-card">
      <span class="earnings-card__label">{{ label() }}</span>
      <span class="earnings-card__amount">PHP {{ amount() | number:'1.2-2' }}</span>
    </div>
  `,
  styles: [`
    .earnings-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 16px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      flex: 1;
    }
    .earnings-card__label {
      font-size: 12px;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .earnings-card__amount {
      font-size: 20px;
      font-weight: 800;
      color: #1a1a2e;
      font-family: monospace;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarningsCardComponent {
  readonly label = input.required<string>();
  readonly amount = input.required<number>();
}
