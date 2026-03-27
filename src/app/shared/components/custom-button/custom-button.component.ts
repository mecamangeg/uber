import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-custom-button',
  template: `
    <button
      [class]="'btn btn--' + bgVariant()"
      [disabled]="disabled()"
      (click)="pressed.emit()">
      @if (iconLeft()) {
        <img [src]="iconLeft()" class="btn__icon btn__icon--left" alt="">
      }
      <span [class]="'btn__text btn__text--' + textVariant()">
        {{ title() }}
      </span>
      @if (iconRight()) {
        <img [src]="iconRight()" class="btn__icon btn__icon--right" alt="">
      }
    </button>
  `,
  styleUrl: './custom-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomButtonComponent {
  readonly title = input.required<string>();
  readonly bgVariant = input<'primary' | 'secondary' | 'danger' | 'outline' | 'success'>('primary');
  readonly textVariant = input<'default' | 'primary' | 'secondary' | 'danger' | 'success'>('default');
  readonly iconLeft = input<string | null>(null);
  readonly iconRight = input<string | null>(null);
  readonly disabled = input<boolean>(false);
  readonly pressed = output<void>();
}
