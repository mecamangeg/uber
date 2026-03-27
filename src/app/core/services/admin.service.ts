import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env';
import type { Driver } from '@models/driver.model';
import type { Ride } from '@models/ride.model';
import type { User, AdminStats } from '@models/user.model';

const MOCK_DRIVERS: Driver[] = [
  { id: 1, first_name: 'Carlos', last_name: 'Santos', profile_image_url: '', car_image_url: '', car_seats: 4, rating: 4.8, latitude: 14.5547, longitude: 121.0244 },
  { id: 2, first_name: 'Maria', last_name: 'Cruz', profile_image_url: '', car_image_url: '', car_seats: 4, rating: 4.6, latitude: 14.5873, longitude: 121.0615 },
  { id: 3, first_name: 'Juan', last_name: 'Reyes', profile_image_url: '', car_image_url: '', car_seats: 6, rating: 4.9, latitude: 14.6091, longitude: 121.0809 },
];

const MOCK_USERS: User[] = [
  { id: 1, name: 'Dev User', email: 'dev@ryde.test', clerk_id: 'dev_user_001', created_at: '2026-03-20' },
  { id: 2, name: 'Jane Doe', email: 'jane@ryde.test', clerk_id: 'user_002', created_at: '2026-03-22' },
];

const MOCK_RIDES: Ride[] = [
  { ride_id: 1, origin_address: 'Makati Ave, Makati', destination_address: 'BGC, Taguig', origin_latitude: 14.5547, origin_longitude: 121.0244, destination_latitude: 14.5505, destination_longitude: 121.0455, ride_time: 15, fare_price: 180, payment_status: 'paid', driver_id: 1, user_id: 'dev_user_001', created_at: '2026-03-25', driver: { first_name: 'Carlos', last_name: 'Santos', car_seats: 4 } },
  { ride_id: 2, origin_address: 'Ortigas Center, Pasig', destination_address: 'Eastwood City, QC', origin_latitude: 14.5873, origin_longitude: 121.0615, destination_latitude: 14.6091, destination_longitude: 121.0809, ride_time: 20, fare_price: 220, payment_status: 'paid', driver_id: 2, user_id: 'dev_user_001', created_at: '2026-03-24', driver: { first_name: 'Maria', last_name: 'Cruz', car_seats: 4 } },
  { ride_id: 3, origin_address: 'SM North EDSA, QC', destination_address: 'Trinoma, QC', origin_latitude: 14.6565, origin_longitude: 121.0310, destination_latitude: 14.6520, destination_longitude: 121.0390, ride_time: 8, fare_price: 95, payment_status: 'pending', driver_id: 3, user_id: 'user_002', created_at: '2026-03-26', driver: { first_name: 'Juan', last_name: 'Reyes', car_seats: 6 } },
];

const MOCK_STATS: AdminStats = { totalDrivers: 3, totalRides: 3, totalUsers: 2, totalRevenue: 400 };

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  readonly drivers = signal<Driver[]>([]);
  readonly rides = signal<Ride[]>([]);
  readonly users = signal<User[]>([]);
  readonly stats = signal<AdminStats>({ totalDrivers: 0, totalRides: 0, totalUsers: 0, totalRevenue: 0 });
  readonly isLoading = signal(false);

  async loadStats(): Promise<void> {
    try {
      if (environment.devBypassAuth) { this.stats.set(MOCK_STATS); return; }
      const resp = await firstValueFrom(this.http.get<{ data: AdminStats }>(`${environment.apiUrl}/api/admin/stats`));
      this.stats.set(resp.data);
    } catch (e) {
      console.error('loadStats:', e);
    }
  }

  async loadDrivers(): Promise<void> {
    this.isLoading.set(true);
    try {
      if (environment.devBypassAuth) { this.drivers.set(MOCK_DRIVERS); return; }
      const resp = await firstValueFrom(this.http.get<{ data: Driver[] }>(`${environment.apiUrl}/api/admin/drivers`));
      this.drivers.set(resp.data ?? []);
    } catch (e) {
      console.error('loadDrivers:', e);
      this.drivers.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createDriver(driver: Omit<Driver, 'id'>): Promise<Driver> {
    if (environment.devBypassAuth) {
      const created = { ...driver, id: Date.now() };
      this.drivers.update(list => [...list, created]);
      return created;
    }
    const resp = await firstValueFrom(this.http.post<{ data: Driver }>(`${environment.apiUrl}/api/admin/drivers`, driver));
    this.drivers.update(list => [...list, resp.data]);
    return resp.data;
  }

  async updateDriver(id: number, driver: Omit<Driver, 'id'>): Promise<Driver> {
    if (environment.devBypassAuth) {
      const updated = { ...driver, id };
      this.drivers.update(list => list.map(d => d.id === id ? updated : d));
      return updated;
    }
    const resp = await firstValueFrom(this.http.put<{ data: Driver }>(`${environment.apiUrl}/api/admin/drivers/${id}`, driver));
    this.drivers.update(list => list.map(d => d.id === id ? resp.data : d));
    return resp.data;
  }

  async deleteDriver(id: number): Promise<void> {
    if (environment.devBypassAuth) {
      this.drivers.update(list => list.filter(d => d.id !== id));
      return;
    }
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/api/admin/drivers/${id}`));
    this.drivers.update(list => list.filter(d => d.id !== id));
  }

  async loadRides(): Promise<void> {
    this.isLoading.set(true);
    try {
      if (environment.devBypassAuth) { this.rides.set(MOCK_RIDES); return; }
      const resp = await firstValueFrom(this.http.get<{ data: Ride[] }>(`${environment.apiUrl}/api/admin/rides`));
      this.rides.set(resp.data ?? []);
    } catch (e) {
      console.error('loadRides:', e);
      this.rides.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    try {
      if (environment.devBypassAuth) { this.users.set(MOCK_USERS); return; }
      const resp = await firstValueFrom(this.http.get<{ data: User[] }>(`${environment.apiUrl}/api/admin/users`));
      this.users.set(resp.data ?? []);
    } catch (e) {
      console.error('loadUsers:', e);
      this.users.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
