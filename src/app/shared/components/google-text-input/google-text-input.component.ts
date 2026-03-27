/// <reference types="google.maps" />
import { Component, ChangeDetectionStrategy, input, output, ElementRef, ViewChild, AfterViewInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import type { LocationCoordinates } from '../../models/location.model';

@Component({
  selector: 'app-google-text-input',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="google-input">
      <div class="google-input__icon-container">
        <img [src]="icon() || 'assets/icons/search.png'" class="google-input__icon" alt="Search" />
      </div>
      <div #autocompleteContainer class="google-input__autocomplete-wrap"></div>
    </div>
  `,
  styleUrl: './google-text-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleTextInputComponent implements AfterViewInit, OnDestroy {
  readonly icon = input<string | null>(null);
  readonly initialLocation = input<string | null>(null);
  readonly locationSelected = output<LocationCoordinates>();

  @ViewChild('autocompleteContainer') container!: ElementRef<HTMLDivElement>;

  private placeElement: any = null;

  ngAfterViewInit() {
    if (typeof google === 'undefined' || !google.maps?.places) {
      this.renderFallbackInput();
      return;
    }

    try {
      // New API: PlaceAutocompleteElement (required for keys created after March 2025)
      const PlaceAutocompleteElement = (google.maps.places as any).PlaceAutocompleteElement;
      if (PlaceAutocompleteElement) {
        this.placeElement = new PlaceAutocompleteElement();
        this.placeElement.style.cssText = 'width:100%;';
        this.placeElement.setAttribute('placeholder', this.initialLocation() || 'Where do you want to go?');

        this.placeElement.addEventListener('gmp-select', async (event: any) => {
          const placePrediction = event.placePrediction;
          if (placePrediction) {
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] });
            const loc = place.location;
            if (loc) {
              this.locationSelected.emit({
                latitude: loc.lat(),
                longitude: loc.lng(),
                address: place.formattedAddress || place.displayName || '',
              });
            }
          }
        });

        this.container.nativeElement.appendChild(this.placeElement);
        return;
      }
    } catch { /* fall through to legacy */ }

    // Fallback: legacy Autocomplete (for older keys)
    this.initLegacyAutocomplete();
  }

  private initLegacyAutocomplete() {
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'google-input__field';
    inputEl.placeholder = this.initialLocation() || 'Where do you want to go?';
    this.container.nativeElement.appendChild(inputEl);

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputEl, {
        fields: ['geometry', 'formatted_address', 'name'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          this.locationSelected.emit({
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            address: place.formatted_address || place.name || '',
          });
        }
      });
    } catch { /* legacy API not available */ }
  }

  private renderFallbackInput() {
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'google-input__field';
    inputEl.placeholder = this.initialLocation() || 'Where do you want to go?';
    inputEl.disabled = true;
    this.container.nativeElement.appendChild(inputEl);
  }

  ngOnDestroy() {
    this.placeElement = null;
  }
}
