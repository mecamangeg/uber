import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component, input, output } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import ConfirmRideComponent from './confirm-ride.component';
import { DriverService } from '@core/services/driver.service';
import { PlatformService } from '@core/services/platform.service';
import { RideLayoutComponent } from '../../../layout/ride-layout/ride-layout.component';
import { DriverCardComponent } from '@shared/components/driver-card/driver-card.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';

// Stub components to avoid Google Maps dependency
@Component({ selector: 'app-ride-layout', template: '<ng-content />' })
class MockRideLayout {
  title = input.required<string>();
}

@Component({ selector: 'app-driver-card', template: '' })
class MockDriverCard {
  item = input.required<any>();
  selected = input<boolean>(false);
  select = output<void>();
}

describe('ConfirmRideComponent', () => {
  let mockDriverService: {
    drivers: ReturnType<typeof vi.fn>;
    selectedDriver: ReturnType<typeof vi.fn>;
    selectDriver: ReturnType<typeof vi.fn>;
    loadDrivers: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDriverService = {
      drivers: vi.fn().mockReturnValue([]),
      selectedDriver: vi.fn().mockReturnValue(null),
      selectDriver: vi.fn(),
      loadDrivers: vi.fn().mockResolvedValue(undefined),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmRideComponent],
      providers: [
        provideHttpClient(),
        { provide: DriverService, useValue: mockDriverService },
        { provide: Router, useValue: router },
        { provide: PlatformService, useValue: { isNative: false, platform: 'web' } },
      ],
    })
      .overrideComponent(ConfirmRideComponent, {
        remove: { imports: [RideLayoutComponent, DriverCardComponent, CustomButtonComponent] },
        add: { imports: [MockRideLayout, MockDriverCard, CustomButtonComponent] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ConfirmRideComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load drivers on init', () => {
    const fixture = TestBed.createComponent(ConfirmRideComponent);
    fixture.componentInstance.ngOnInit();
    expect(mockDriverService.loadDrivers).toHaveBeenCalled();
  });

  it('should navigate to book-ride on selectRide', () => {
    const fixture = TestBed.createComponent(ConfirmRideComponent);
    fixture.componentInstance.selectRide();
    expect(router.navigate).toHaveBeenCalledWith(['/app/book-ride']);
  });
});
