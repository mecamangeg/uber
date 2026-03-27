import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DriverService } from './driver.service';
import { environment } from '@env';

describe('DriverService', () => {
  let service: DriverService;
  let httpMock: HttpTestingController;
  let originalBypass: boolean;

  beforeEach(() => {
    originalBypass = environment.devBypassAuth;
    (environment as any).devBypassAuth = false;

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DriverService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    (environment as any).devBypassAuth = originalBypass;
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty state', () => {
    expect(service.drivers()).toEqual([]);
    expect(service.selectedDriver()).toBeNull();
    expect(service.driverTimes()).toEqual({});
  });

  it('should load drivers from API', async () => {
    const mockDrivers = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        profile_image_url: 'http://example.com/john.jpg',
        car_image_url: 'http://example.com/car.jpg',
        car_seats: 4,
        rating: 4.8,
        latitude: 14.5995,
        longitude: 120.9842,
      },
    ];

    const loadPromise = service.loadDrivers();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/drivers`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockDrivers });

    await loadPromise;

    expect(service.drivers().length).toBe(1);
    expect(service.drivers()[0].title).toBe('John Doe');
    expect(service.drivers()[0].id).toBe(1);
  });

  it('should select and clear driver', () => {
    service.selectDriver(5);
    expect(service.selectedDriver()).toBe(5);

    service.clearSelection();
    expect(service.selectedDriver()).toBeNull();
  });
});
