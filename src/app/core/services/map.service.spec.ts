import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { LocationService } from './location.service';
import { PlatformService } from './platform.service';

describe('MapService', () => {
  let service: MapService;
  let location: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PlatformService, useValue: { isNative: false, platform: 'web' } },
      ],
    });
    service = TestBed.inject(MapService);
    location = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default region when no user location', () => {
    const region = service.region();
    expect(region.center.lat).toBe(14.5995);
    expect(region.center.lng).toBe(120.9842);
    expect(region.zoom).toBe(14);
  });

  it('should center on user location when set', () => {
    location.setUserLocation({ latitude: 10.0, longitude: 120.0, address: 'Test' });

    const region = service.region();
    expect(region.center.lat).toBe(10.0);
    expect(region.center.lng).toBe(120.0);
    expect(region.zoom).toBe(15);
  });

  it('should center between user and destination when both set', () => {
    location.setUserLocation({ latitude: 10.0, longitude: 120.0, address: 'From' });
    location.setDestinationLocation({ latitude: 12.0, longitude: 122.0, address: 'To' });

    const region = service.region();
    expect(region.center.lat).toBe(11.0); // midpoint
    expect(region.center.lng).toBe(121.0); // midpoint
    expect(region.zoom).toBe(12);
  });

  it('should return user marker when location is set', () => {
    expect(service.markers()).toEqual([]);

    location.setUserLocation({ latitude: 10.0, longitude: 120.0, address: 'Test' });

    expect(service.markers().length).toBe(1);
    expect(service.markers()[0]).toEqual({ lat: 10.0, lng: 120.0 });
  });
});
