import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-input-field',
  template: `
    <div class="input-field">
      <label class="input-field__label">{{ label() }}</label>
      <div class="input-field__container">
        @if (icon()) {
          <img [src]="icon()" class="input-field__icon" alt="" />
        }
        <input
          [type]="secureTextEntry() ? 'password' : 'text'"
          class="input-field__input"
          [placeholder]="placeholder()"
          [value]="value()"
          (input)="onInput($event)"
          [disabled]="disabled()"
        />
      </div>
    </div>
  `,
  styleUrl: './input-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  readonly label = input.required<string>();
  readonly icon = input<string | null>(null);
  readonly placeholder = input<string>('');
  readonly secureTextEntry = input<boolean>(false);
  readonly value = input<string>('');
  readonly disabled = input<boolean>(false);

  readonly valueChange = output<string>();

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
