import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';
import type { Driver, MarkerData } from '../../shared/models/driver.model';

const MOCK_DRIVERS: MarkerData[] = [
  {
    id: 1,
    first_name: 'Carlos',
    last_name: 'Santos',
    profile_image_url: 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/',
    car_image_url: 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/',
    car_seats: 4,
    rating: 4.9,
    latitude: 14.5547,
    longitude: 121.0244,
    title: 'Carlos Santos',
    time: 12,
    price: '180',
  },
  {
    id: 2,
    first_name: 'Maria',
    last_name: 'Cruz',
    profile_image_url: 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/',
    car_image_url: 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/',
    car_seats: 4,
    rating: 4.7,
    latitude: 14.5600,
    longitude: 121.0300,
    title: 'Maria Cruz',
    time: 18,
    price: '220',
  },
  {
    id: 3,
    first_name: 'Juan',
    last_name: 'Reyes',
    profile_image_url: 'https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/',
    car_image_url: 'https://ucarecdn.com/a2dc52b2-8bf7-4e49-8a32-3236e1f0a2ca/-/preview/465x466/',
    car_seats: 6,
    rating: 4.8,
    latitude: 14.5500,
    longitude: 121.0400,
    title: 'Juan Reyes',
    time: 8,
    price: '350',
  },
];

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly http = inject(HttpClient);

  readonly drivers = signal<MarkerData[]>([]);
  readonly selectedDriver = signal<number | null>(null);
  readonly driverTimes = signal<Record<number, { time: number; price: string }>>({});

  async loadDrivers(): Promise<void> {
    if (environment.devBypassAuth) {
      this.drivers.set(MOCK_DRIVERS);
      return;
    }

    try {
      const resp = await firstValueFrom(
        this.http.get<{ data: Driver[] }>(`${environment.apiUrl}/api/drivers`)
      );
      if (resp.data) {
        this.drivers.set(resp.data.map(d => ({
          ...d,
          latitude: d.latitude ?? 0,
          longitude: d.longitude ?? 0,
          id: d.id,
          title: `${d.first_name} ${d.last_name}`,
        })));
      }
    } catch(e) {
      console.error(e);
    }
  }

  selectDriver(id: number): void { this.selectedDriver.set(id); }
  clearSelection(): void { this.selectedDriver.set(null); }
}
