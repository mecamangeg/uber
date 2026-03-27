import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import RidesComponent from './rides.component';
import { AuthService } from '@core/services/auth.service';
import { RideService } from '@core/services/ride.service';

describe('RidesComponent', () => {
  let mockAuthService: { user: ReturnType<typeof vi.fn> };
  let mockRideService: {
    isLoading: ReturnType<typeof vi.fn>;
    recentRides: ReturnType<typeof vi.fn>;
    loadRides: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthService = {
      user: vi.fn().mockReturnValue({ id: 'user_1' }),
    };
    mockRideService = {
      isLoading: vi.fn().mockReturnValue(false),
      recentRides: vi.fn().mockReturnValue([]),
      loadRides: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [RidesComponent],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: RideService, useValue: mockRideService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RidesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load rides on init', () => {
    const fixture = TestBed.createComponent(RidesComponent);
    fixture.componentInstance.ngOnInit();
    expect(mockRideService.loadRides).toHaveBeenCalledWith('user_1');
  });
});
