import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';
import { PlatformService } from './platform.service';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PlatformService, useValue: { isNative: false, platform: 'web' } },
      ],
    });
    service = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null values', () => {
    expect(service.userLatitude()).toBeNull();
    expect(service.userLongitude()).toBeNull();
    expect(service.userAddress()).toBeNull();
    expect(service.destinationLatitude()).toBeNull();
    expect(service.destinationLongitude()).toBeNull();
    expect(service.destinationAddress()).toBeNull();
  });

  it('should report hasDestination as false initially', () => {
    expect(service.hasDestination()).toBe(false);
  });

  it('should set user location', () => {
    service.setUserLocation({ latitude: 14.5995, longitude: 120.9842, address: 'Manila' });

    expect(service.userLatitude()).toBe(14.5995);
    expect(service.userLongitude()).toBe(120.9842);
    expect(service.userAddress()).toBe('Manila');
  });

  it('should set destination location and update hasDestination', () => {
    expect(service.hasDestination()).toBe(false);

    service.setDestinationLocation({ latitude: 14.55, longitude: 121.0, address: 'Makati' });

    expect(service.destinationLatitude()).toBe(14.55);
    expect(service.destinationLongitude()).toBe(121.0);
    expect(service.destinationAddress()).toBe('Makati');
    expect(service.hasDestination()).toBe(true);
  });

  it('should clear destination', () => {
    service.setDestinationLocation({ latitude: 14.55, longitude: 121.0, address: 'Makati' });
    expect(service.hasDestination()).toBe(true);

    service.clearDestination();

    expect(service.destinationLatitude()).toBeNull();
    expect(service.destinationLongitude()).toBeNull();
    expect(service.destinationAddress()).toBeNull();
    expect(service.hasDestination()).toBe(false);
  });
});
