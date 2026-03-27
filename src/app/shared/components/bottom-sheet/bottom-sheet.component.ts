import { Component, ChangeDetectionStrategy, input, signal, OnInit } from '@angular/core';

@Component({
  selector: 'app-bottom-sheet',
  template: `
    <div class="bottom-sheet" [class.bottom-sheet--expanded]="expanded()">
      <div class="bottom-sheet__handle-area" (click)="toggle()">
        <div class="bottom-sheet__handle"></div>
      </div>
      <div class="bottom-sheet__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './bottom-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent implements OnInit {
  readonly initialExpanded = input<boolean>(false);
  readonly expanded = signal<boolean>(false);

  ngOnInit() {
    this.expanded.set(this.initialExpanded());
  }

  toggle() {
    this.expanded.update(v => !v);
  }
}
