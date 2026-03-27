/// <reference types="google.maps" />
import { Injectable, inject, signal, computed } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { PlatformService } from './platform.service';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly platform = inject(PlatformService);
  readonly userLatitude = signal<number | null>(null);
  readonly userLongitude = signal<number | null>(null);
  readonly userAddress = signal<string | null>(null);
  readonly destinationLatitude = signal<number | null>(null);
  readonly destinationLongitude = signal<number | null>(null);
  readonly destinationAddress = signal<string | null>(null);

  readonly hasDestination = computed(() =>
    this.destinationLatitude() !== null && this.destinationLongitude() !== null
  );

  setUserLocation(loc: { latitude: number; longitude: number; address: string }) {
    this.userLatitude.set(loc.latitude);
    this.userLongitude.set(loc.longitude);
    this.userAddress.set(loc.address);
  }

  setDestinationLocation(loc: { latitude: number; longitude: number; address: string }) {
    this.destinationLatitude.set(loc.latitude);
    this.destinationLongitude.set(loc.longitude);
    this.destinationAddress.set(loc.address);
  }

  clearDestination() {
    this.destinationLatitude.set(null);
    this.destinationLongitude.set(null);
    this.destinationAddress.set(null);
  }

  async requestCurrentLocation(): Promise<void> {
    try {
      if (this.platform.isNative) {
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'granted') {
          const position = await Geolocation.getCurrentPosition();
          const address = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
          this.setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address,
          });
        }
      } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const address = await this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          this.setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address,
          });
        });
      }
    } catch (e) {
      console.error('Location error:', e);
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (typeof google === 'undefined' || !google.maps) return 'Current location';

    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results?.[0]) {
        const result = response.results[0];
        const name = result.address_components?.find(c => c.types.includes('route'))?.long_name;
        const area = result.address_components?.find(c =>
          c.types.includes('sublocality') || c.types.includes('locality')
        )?.long_name;
        return [name, area].filter(Boolean).join(', ') || result.formatted_address;
      }
    } catch { /* fall through */ }
    return 'Current location';
  }
}
