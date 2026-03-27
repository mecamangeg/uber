/// <reference types="google.maps" />
import { Injectable, inject, computed } from '@angular/core';
import { LocationService } from './location.service';
import { DriverService } from './driver.service';

@Injectable({ providedIn: 'root' })
export class MapService {
  private readonly location = inject(LocationService);
  private readonly driver = inject(DriverService);

  readonly region = computed(() => {
    const lat = this.location.userLatitude();
    const lng = this.location.userLongitude();
    if (!lat || !lng) return { center: { lat: 14.5995, lng: 120.9842 }, zoom: 14 };

    const dLat = this.location.destinationLatitude();
    const dLng = this.location.destinationLongitude();
    if (dLat && dLng) {
      return {
        center: { lat: (lat + dLat) / 2, lng: (lng + dLng) / 2 },
        zoom: 12,
      };
    }
    return { center: { lat, lng }, zoom: 15 };
  });

  readonly markers = computed(() => {
    const result: google.maps.LatLngLiteral[] = [];
    const lat = this.location.userLatitude();
    const lng = this.location.userLongitude();
    if (lat && lng) result.push({ lat, lng });
    return result;
  });
}
