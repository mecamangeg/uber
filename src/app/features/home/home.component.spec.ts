import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component, input, output } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import HomeComponent from './home.component';
import { AuthService } from '@core/services/auth.service';
import { LocationService } from '@core/services/location.service';
import { RideService } from '@core/services/ride.service';
import { PlatformService } from '@core/services/platform.service';
import { GoogleTextInputComponent } from '@shared/components/google-text-input/google-text-input.component';
import { MapComponent } from '@shared/components/map/map.component';
import { RideCardComponent } from '@shared/components/ride-card/ride-card.component';

// Stub components to avoid Google Maps dependency
@Component({ selector: 'app-google-text-input', template: '' })
class MockGoogleTextInput {
  icon = input<string | null>(null);
  initialLocation = input<string | null>(null);
  locationSelected = output<any>();
}

@Component({ selector: 'app-map', template: '' })
class MockMap {}

@Component({ selector: 'app-ride-card', template: '' })
class MockRideCard {
  ride = input.required<any>();
}

describe('HomeComponent', () => {
  let mockAuthService: { user: ReturnType<typeof vi.fn>; signOut: ReturnType<typeof vi.fn> };
  let mockRideService: {
    isLoading: ReturnType<typeof vi.fn>;
    recentRides: ReturnType<typeof vi.fn>;
    loadRides: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 'user_1', firstName: 'Jane' }),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    mockRideService = {
      isLoading: vi.fn().mockReturnValue(false),
      recentRides: vi.fn().mockReturnValue([]),
      loadRides: vi.fn().mockResolvedValue(undefined),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: RideService, useValue: mockRideService },
        { provide: Router, useValue: router },
        { provide: PlatformService, useValue: { isNative: false, platform: 'web' } },
      ],
    })
      .overrideComponent(HomeComponent, {
        remove: { imports: [GoogleTextInputComponent, MapComponent, RideCardComponent] },
        add: { imports: [MockGoogleTextInput, MockMap, MockRideCard] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set firstName from auth user on init', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.firstName()).toBe('Jane');
  });

  it('should load rides on init', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.componentInstance.ngOnInit();
    expect(mockRideService.loadRides).toHaveBeenCalledWith('user_1');
  });

  it('should navigate to find-ride on destination selected', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const locationService = TestBed.inject(LocationService);

    fixture.componentInstance.onDestinationSelected({
      latitude: 14.55,
      longitude: 121.0,
      address: 'Makati',
    });

    expect(locationService.destinationLatitude()).toBe(14.55);
    expect(router.navigate).toHaveBeenCalledWith(['/app/find-ride']);
  });

  it('should sign out and navigate to sign-in', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.componentInstance.signOut();
    expect(mockAuthService.signOut).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/sign-in']);
  });
});
