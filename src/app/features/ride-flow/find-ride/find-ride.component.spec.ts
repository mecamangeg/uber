import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component, input, output } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import FindRideComponent from './find-ride.component';
import { LocationService } from '@core/services/location.service';
import { PlatformService } from '@core/services/platform.service';
import { RideLayoutComponent } from '../../../layout/ride-layout/ride-layout.component';
import { GoogleTextInputComponent } from '@shared/components/google-text-input/google-text-input.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';

@Component({ selector: 'app-ride-layout', template: '<ng-content />' })
class MockRideLayout {
  title = input.required<string>();
}

@Component({ selector: 'app-google-text-input', template: '' })
class MockGoogleTextInput {
  icon = input<string | null>(null);
  initialLocation = input<string | null>(null);
  locationSelected = output<any>();
}

describe('FindRideComponent', () => {
  let locationService: LocationService;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FindRideComponent],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: router },
        { provide: PlatformService, useValue: { isNative: false, platform: 'web' } },
      ],
    })
      .overrideComponent(FindRideComponent, {
        remove: { imports: [RideLayoutComponent, GoogleTextInputComponent, CustomButtonComponent] },
        add: { imports: [MockRideLayout, MockGoogleTextInput, CustomButtonComponent] },
      })
      .compileComponents();

    locationService = TestBed.inject(LocationService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FindRideComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set user location on "from" selection', () => {
    const fixture = TestBed.createComponent(FindRideComponent);
    fixture.componentInstance.onFromSelected({
      latitude: 14.5,
      longitude: 120.9,
      address: 'Manila',
    });

    expect(locationService.userLatitude()).toBe(14.5);
    expect(locationService.userAddress()).toBe('Manila');
  });

  it('should set destination on "to" selection', () => {
    const fixture = TestBed.createComponent(FindRideComponent);
    fixture.componentInstance.onToSelected({
      latitude: 14.6,
      longitude: 121.0,
      address: 'Makati',
    });

    expect(locationService.destinationLatitude()).toBe(14.6);
    expect(locationService.destinationAddress()).toBe('Makati');
  });

  it('should navigate to confirm-ride on findRide', () => {
    const fixture = TestBed.createComponent(FindRideComponent);
    fixture.componentInstance.findRide();
    expect(router.navigate).toHaveBeenCalledWith(['/app/confirm-ride']);
  });
});
