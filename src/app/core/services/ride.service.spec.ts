import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RideService } from './ride.service';
import { environment } from '@env';

describe('RideService', () => {
  let service: RideService;
  let httpMock: HttpTestingController;
  let originalBypass: boolean;

  beforeEach(() => {
    originalBypass = environment.devBypassAuth;
    (environment as any).devBypassAuth = false; // Test real HTTP behavior

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RideService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    (environment as any).devBypassAuth = originalBypass;
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty rides and not loading', () => {
    expect(service.recentRides()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it('should load rides for a user', async () => {
    const mockRides = [
      {
        ride_id: 1,
        origin_address: 'Manila',
        destination_address: 'Makati',
        origin_latitude: 14.5995,
        origin_longitude: 120.9842,
        destination_latitude: 14.55,
        destination_longitude: 121.0,
        ride_time: 25,
        fare_price: 150,
        payment_status: 'paid',
        driver_id: 1,
        user_id: 'user123',
        created_at: '2026-01-01',
        driver: { first_name: 'John', last_name: 'Doe', car_seats: 4 },
      },
    ];

    const loadPromise = service.loadRides('user123');

    const req = httpMock.expectOne(`${environment.apiUrl}/api/rides/user123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockRides });

    await loadPromise;

    expect(service.recentRides()).toEqual(mockRides);
    expect(service.isLoading()).toBe(false);
  });

  it('should handle load rides error gracefully', async () => {
    const loadPromise = service.loadRides('user123');

    const req = httpMock.expectOne(`${environment.apiUrl}/api/rides/user123`);
    req.error(new ProgressEvent('Network error'));

    await loadPromise;

    expect(service.recentRides()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it('should create a ride', async () => {
    const rideData = {
      origin_address: 'Manila',
      destination_address: 'Makati',
      origin_latitude: 14.5995,
      origin_longitude: 120.9842,
      destination_latitude: 14.55,
      destination_longitude: 121.0,
      ride_time: 25,
      fare_price: 150,
      payment_status: 'pending',
      driver_id: 1,
      user_id: 'user123',
    };

    const mockResponse = {
      ...rideData,
      ride_id: 42,
      created_at: '2026-01-01',
      driver: { first_name: 'John', last_name: 'Doe', car_seats: 4 },
    };

    const createPromise = service.createRide(rideData);

    const req = httpMock.expectOne(`${environment.apiUrl}/api/rides`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(rideData);
    req.flush({ data: mockResponse });

    const result = await createPromise;
    expect(result.ride_id).toBe(42);
  });
});
