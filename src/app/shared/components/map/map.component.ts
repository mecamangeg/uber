/// <reference types="google.maps" />
import { Component, ChangeDetectionStrategy, inject, effect, OnInit } from '@angular/core';
import { GoogleMap, MapMarker, MapDirectionsRenderer } from '@angular/google-maps';
import { LocationService } from '../../../core/services/location.service';
import { DriverService } from '../../../core/services/driver.service';
import { MapService } from '../../../core/services/map.service';

@Component({
  selector: 'app-map',
  imports: [GoogleMap, MapMarker, MapDirectionsRenderer],
  template: `
    <google-map
      [center]="mapService.region().center"
      [zoom]="mapService.region().zoom"
      width="100%"
      height="100%">

      @if (location.userLatitude() && location.userLongitude()) {
        <map-marker
          [position]="{ lat: location.userLatitude()!, lng: location.userLongitude()! }"
          [options]="{ icon: { url: 'assets/icons/pin.png', scaledSize: markerSize } }" />
      }

      @for (driver of driverService.drivers(); track driver.id) {
        <map-marker
          [position]="{ lat: driver.latitude, lng: driver.longitude }"
          [title]="driver.title" />
      }

      @if (directionsResult) {
        <map-directions-renderer [directions]="directionsResult" />
      }
    </google-map>
  `,
  styleUrl: './map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'map-container' }
})
export class MapComponent implements OnInit {
  readonly location = inject(LocationService);
  readonly driverService = inject(DriverService);
  readonly mapService = inject(MapService);

  directionsResult: google.maps.DirectionsResult | null = null;
  markerSize: google.maps.Size | null = null;

  constructor() {
    effect(() => {
      const dLat = this.location.destinationLatitude();
      const dLng = this.location.destinationLongitude();
      const uLat = this.location.userLatitude();
      const uLng = this.location.userLongitude();
      if (dLat && dLng && uLat && uLng) {
        this.calculateRoute(
          { lat: uLat, lng: uLng },
          { lat: dLat, lng: dLng }
        );
      }
    });
  }

  ngOnInit() {
    if (typeof google !== 'undefined' && google.maps && google.maps.Size) {
      this.markerSize = new google.maps.Size(40, 40);
    }
  }

  private calculateRoute(origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) {
    if (typeof google === 'undefined' || !google.maps) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    }).then(result => {
      this.directionsResult = result;
    }).catch(() => {
      // Directions API may not be enabled — show origin/destination markers instead
      console.warn('Directions API unavailable — showing markers only');
    });
  }
}
