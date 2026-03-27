import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';
import type { DriverProfile, DriverEarnings, DriverEarningRecord, DriverRegistration, RideRequest } from '@models/driver-portal.model';
import type { RideStatus } from '@models/ride.model';

const MOCK_PROFILE: DriverProfile = {
  id: 1, clerk_id: 'dev_user_001', email: 'carlos@ryde.test',
  first_name: 'Carlos', last_name: 'Santos', phone: '+63 912 345 6789',
  profile_image_url: '', car_image_url: '',
  car_make: 'Toyota', car_model: 'Vios', car_year: 2023, car_color: 'White',
  car_seats: 4, license_plate: 'ABC 1234', license_number: 'N01-23-456789',
  rating: 4.9, is_online: false, is_verified: true,
  total_earnings: 12500, total_rides_completed: 87,
  latitude: 14.5547, longitude: 121.0244, created_at: '2026-01-15',
};

const MOCK_EARNINGS: DriverEarnings = { today: 850, week: 4200, total: 12500, totalRides: 87 };

const MOCK_ACTIVE_RIDE: RideRequest = {
  ride_id: 10, origin_address: 'Makati Ave, Makati', destination_address: 'BGC, Taguig',
  origin_latitude: 14.5547, origin_longitude: 121.0244,
  destination_latitude: 14.5505, destination_longitude: 121.0455,
  ride_time: 15, fare_price: 180, status: 'pending',
  customer: { name: 'Dev User', email: 'dev@ryde.test' },
  created_at: new Date().toISOString(),
};

@Injectable({ providedIn: 'root' })
export class DriverPortalService {
  private readonly http = inject(HttpClient);

  readonly profile = signal<DriverProfile | null>(null);
  readonly earnings = signal<DriverEarnings>({ today: 0, week: 0, total: 0, totalRides: 0 });
  readonly earningsHistory = signal<DriverEarningRecord[]>([]);
  readonly activeRide = signal<RideRequest | null>(null);
  readonly rideHistory = signal<RideRequest[]>([]);
  readonly isLoading = signal(false);

  async loadProfile(clerkId: string): Promise<DriverProfile | null> {
    try {
      if (environment.devBypassAuth) {
        this.profile.set(MOCK_PROFILE);
        return MOCK_PROFILE;
      }
      const resp = await firstValueFrom(
        this.http.get<{ data: DriverProfile }>(`${environment.apiUrl}/api/driver/profile/${clerkId}`)
      );
      this.profile.set(resp.data);
      return resp.data;
    } catch (e: any) {
      if (e?.status === 404) {
        this.profile.set(null);
        return null;
      }
      console.error('loadProfile:', e);
      return null;
    }
  }

  async register(data: DriverRegistration): Promise<DriverProfile> {
    if (environment.devBypassAuth) {
      const created: DriverProfile = {
        ...MOCK_PROFILE, ...data, id: Date.now(),
        rating: 5.0, is_online: false, is_verified: false,
        total_earnings: 0, total_rides_completed: 0, created_at: new Date().toISOString(),
      };
      this.profile.set(created);
      return created;
    }
    const resp = await firstValueFrom(
      this.http.post<{ data: DriverProfile }>(`${environment.apiUrl}/api/driver/register`, data)
    );
    this.profile.set(resp.data);
    return resp.data;
  }

  async updateProfile(clerkId: string, data: Partial<DriverProfile>): Promise<DriverProfile> {
    if (environment.devBypassAuth) {
      const updated = { ...this.profile()!, ...data };
      this.profile.set(updated);
      return updated;
    }
    const resp = await firstValueFrom(
      this.http.put<{ data: DriverProfile }>(`${environment.apiUrl}/api/driver/profile/${clerkId}`, data)
    );
    this.profile.set(resp.data);
    return resp.data;
  }

  async toggleOnline(clerkId: string, isOnline: boolean, lat?: number, lng?: number): Promise<void> {
    if (environment.devBypassAuth) {
      this.profile.update(p => p ? { ...p, is_online: isOnline } : p);
      return;
    }
    const resp = await firstValueFrom(
      this.http.patch<{ data: DriverProfile }>(`${environment.apiUrl}/api/driver/online/${clerkId}`, {
        is_online: isOnline, latitude: lat, longitude: lng,
      })
    );
    this.profile.set(resp.data);
  }

  async loadActiveRide(driverId: number): Promise<RideRequest | null> {
    if (environment.devBypassAuth) {
      this.activeRide.set(MOCK_ACTIVE_RIDE);
      return MOCK_ACTIVE_RIDE;
    }
    try {
      const resp = await firstValueFrom(
        this.http.get<{ data: RideRequest | null }>(`${environment.apiUrl}/api/driver/rides/active/${driverId}`)
      );
      this.activeRide.set(resp.data);
      return resp.data;
    } catch (e) {
      console.error('loadActiveRide:', e);
      return null;
    }
  }

  async loadRideHistory(driverId: number): Promise<void> {
    this.isLoading.set(true);
    try {
      if (environment.devBypassAuth) {
        this.rideHistory.set([{ ...MOCK_ACTIVE_RIDE, status: 'completed' }]);
        return;
      }
      const resp = await firstValueFrom(
        this.http.get<{ data: RideRequest[] }>(`${environment.apiUrl}/api/driver/rides/history/${driverId}`)
      );
      this.rideHistory.set(resp.data ?? []);
    } catch (e) {
      console.error('loadRideHistory:', e);
      this.rideHistory.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateRideStatus(rideId: number, status: RideStatus, driverId: string): Promise<void> {
    if (environment.devBypassAuth) {
      this.activeRide.update(r => r ? { ...r, status } : r);
      return;
    }
    await firstValueFrom(
      this.http.patch(`${environment.apiUrl}/api/rides/${rideId}/status`, {
        status, actor_type: 'driver', actor_id: driverId,
      })
    );
  }

  async loadEarnings(driverId: number): Promise<void> {
    try {
      if (environment.devBypassAuth) {
        this.earnings.set(MOCK_EARNINGS);
        return;
      }
      const resp = await firstValueFrom(
        this.http.get<{ data: DriverEarnings }>(`${environment.apiUrl}/api/driver/earnings/${driverId}`)
      );
      this.earnings.set(resp.data);
    } catch (e) {
      console.error('loadEarnings:', e);
    }
  }

  async loadEarningsHistory(driverId: number): Promise<void> {
    this.isLoading.set(true);
    try {
      if (environment.devBypassAuth) {
        this.earningsHistory.set([]);
        return;
      }
      const resp = await firstValueFrom(
        this.http.get<{ data: DriverEarningRecord[] }>(`${environment.apiUrl}/api/driver/earnings/${driverId}/history`)
      );
      this.earningsHistory.set(resp.data ?? []);
    } catch (e) {
      console.error('loadEarningsHistory:', e);
      this.earningsHistory.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
