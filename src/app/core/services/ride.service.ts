import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';
import type { Ride, RideStatus } from '../../shared/models/ride.model';

const MOCK_RIDES: Ride[] = [
  {
    ride_id: 1,
    origin_address: 'Makati Ave, Makati',
    destination_address: 'BGC, Taguig',
    origin_latitude: 14.5547,
    origin_longitude: 121.0244,
    destination_latitude: 14.5505,
    destination_longitude: 121.0455,
    ride_time: 15,
    fare_price: 180,
    payment_status: 'paid',
    status: 'completed',
    driver_id: 1,
    user_id: 'dev_user_001',
    created_at: '2026-03-25',
    driver: { first_name: 'Carlos', last_name: 'Santos', car_seats: 4 },
  },
  {
    ride_id: 2,
    origin_address: 'Ortigas Center, Pasig',
    destination_address: 'Eastwood City, QC',
    origin_latitude: 14.5873,
    origin_longitude: 121.0615,
    destination_latitude: 14.6091,
    destination_longitude: 121.0809,
    ride_time: 20,
    fare_price: 220,
    payment_status: 'pending',
    status: 'pending',
    driver_id: 2,
    user_id: 'dev_user_001',
    created_at: '2026-03-24',
    driver: { first_name: 'Maria', last_name: 'Cruz', car_seats: 4 },
  },
];

@Injectable({ providedIn: 'root' })
export class RideService {
  private readonly http = inject(HttpClient);

  readonly recentRides = signal<Ride[]>([]);
  readonly isLoading = signal(false);

  async loadRides(userId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      if (environment.devBypassAuth) {
        this.recentRides.set(MOCK_RIDES);
        return;
      }
      const resp = await firstValueFrom(
        this.http.get<{ data: Ride[] }>(`${environment.apiUrl}/api/rides/${userId}`)
      );
      this.recentRides.set(resp.data ?? []);
    } catch(e) {
      console.error(e);
      this.recentRides.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createRide(rideData: Omit<Ride, 'ride_id' | 'created_at' | 'driver'>): Promise<Ride> {
    if (environment.devBypassAuth) {
      return { ...rideData, ride_id: Date.now(), created_at: new Date().toISOString(), driver: { first_name: 'Dev', last_name: 'Driver', car_seats: 4 } };
    }
    const resp = await firstValueFrom(
      this.http.post<{ data: Ride }>(`${environment.apiUrl}/api/rides`, rideData)
    );
    return resp.data;
  }

  async cancelRide(rideId: number, actorType: string, actorId: string, reason?: string): Promise<Ride> {
    const status: RideStatus = actorType === 'driver' ? 'driver_cancelled' : 'cancelled';
    if (environment.devBypassAuth) {
      this.recentRides.update(rides => rides.map(r =>
        r.ride_id === rideId ? { ...r, status, cancelled_by: actorType, cancelled_at: new Date().toISOString(), cancel_reason: reason } : r
      ));
      return this.recentRides().find(r => r.ride_id === rideId)!;
    }
    const resp = await firstValueFrom(
      this.http.patch<{ data: Ride }>(`${environment.apiUrl}/api/rides/${rideId}/status`, {
        status, actor_type: actorType, actor_id: actorId, reason,
      })
    );
    this.recentRides.update(rides => rides.map(r => r.ride_id === rideId ? { ...r, ...resp.data } : r));
    return resp.data;
  }
}
