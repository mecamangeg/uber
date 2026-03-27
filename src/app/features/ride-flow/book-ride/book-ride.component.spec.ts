import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component, input } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import BookRideComponent from './book-ride.component';
import { AuthService } from '@core/services/auth.service';
import { DriverService } from '@core/services/driver.service';
import { LocationService } from '@core/services/location.service';
import { RideService } from '@core/services/ride.service';
import { PaymentService } from '@core/services/payment.service';
import { PlatformService } from '@core/services/platform.service';
import { RideLayoutComponent } from '../../../layout/ride-layout/ride-layout.component';

@Component({ selector: 'app-ride-layout', template: '<ng-content />' })
class MockRideLayout {
  title = input.required<string>();
}

describe('BookRideComponent', () => {
  let mockAuthService: { user: ReturnType<typeof vi.fn>; getToken: ReturnType<typeof vi.fn> };
  let mockDriverService: {
    drivers: ReturnType<typeof vi.fn>;
    selectedDriver: ReturnType<typeof vi.fn>;
  };
  let mockRideService: { createRide: ReturnType<typeof vi.fn> };
  let mockPaymentService: {
    paymentStatus: ReturnType<typeof vi.fn>;
    isProcessing: ReturnType<typeof vi.fn>;
    payForRide: ReturnType<typeof vi.fn>;
    confirmPayment: ReturnType<typeof vi.fn>;
  };

  const testDriver = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    profile_image_url: 'http://example.com/john.jpg',
    car_image_url: 'http://example.com/car.jpg',
    car_seats: 4,
    rating: 4.8,
    latitude: 14.5995,
    longitude: 120.9842,
    title: 'John Doe',
    time: 15,
    price: '250',
  };

  beforeEach(async () => {
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 'user_1' }),
      getToken: vi.fn().mockResolvedValue('token'),
    };
    mockDriverService = {
      drivers: vi.fn().mockReturnValue([testDriver]),
      selectedDriver: vi.fn().mockReturnValue(1),
    };
    mockRideService = {
      createRide: vi.fn().mockResolvedValue({ ride_id: 42, fare_price: 250 }),
    };
    mockPaymentService = {
      paymentStatus: vi.fn().mockReturnValue('idle'),
      isProcessing: vi.fn().mockReturnValue(false),
      payForRide: vi.fn().mockResolvedValue('ref_123'),
      confirmPayment: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [BookRideComponent],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: DriverService, useValue: mockDriverService },
        { provide: RideService, useValue: mockRideService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: PlatformService, useValue: { isNative: false, platform: 'web' } },
      ],
    })
      .overrideComponent(BookRideComponent, {
        remove: { imports: [RideLayoutComponent] },
        add: { imports: [MockRideLayout] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BookRideComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compute selected driver', () => {
    const fixture = TestBed.createComponent(BookRideComponent);
    const driver = fixture.componentInstance.driver();
    expect(driver).toBeTruthy();
    expect(driver!.title).toBe('John Doe');
    expect(driver!.price).toBe('250');
  });

  it('should format time correctly', () => {
    const fixture = TestBed.createComponent(BookRideComponent);
    expect(fixture.componentInstance.formatTimeDisplay(15)).toBe('15 min');
    expect(fixture.componentInstance.formatTimeDisplay(90)).toBe('1h 30m');
  });

  it('should call createRide and payForRide on bookRide', async () => {
    const fixture = TestBed.createComponent(BookRideComponent);
    const locationService = TestBed.inject(LocationService);
    locationService.setUserLocation({ latitude: 14.5, longitude: 120.9, address: 'From' });
    locationService.setDestinationLocation({ latitude: 14.6, longitude: 121.0, address: 'To' });

    await fixture.componentInstance.bookRide();

    expect(mockRideService.createRide).toHaveBeenCalled();
    expect(mockPaymentService.payForRide).toHaveBeenCalledWith(42, 250);
    expect(mockPaymentService.confirmPayment).toHaveBeenCalledWith('ref_123');
  });

  it('should not book if no driver selected', async () => {
    mockDriverService.selectedDriver.mockReturnValue(null);
    const fixture = TestBed.createComponent(BookRideComponent);
    await fixture.componentInstance.bookRide();
    expect(mockRideService.createRide).not.toHaveBeenCalled();
  });
});
