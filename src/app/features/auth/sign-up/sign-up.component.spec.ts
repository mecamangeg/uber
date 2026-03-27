import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import SignUpComponent from './sign-up.component';
import { AuthService } from '@core/services/auth.service';

describe('SignUpComponent', () => {
  let mockAuthService: {
    signUpWithEmail: ReturnType<typeof vi.fn>;
    verifyEmailOTP: ReturnType<typeof vi.fn>;
    user: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      signUpWithEmail: vi.fn(),
      verifyEmailOTP: vi.fn(),
      user: vi.fn().mockReturnValue({ id: 'user_123' }),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize with default state', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const comp = fixture.componentInstance;
    expect(comp.signUpForm.value).toEqual({ name: '', email: '', password: '' });
    expect(comp.verification().state).toBe('default');
  });

  it('should validate required fields', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const comp = fixture.componentInstance;
    expect(comp.signUpForm.invalid).toBe(true);

    comp.signUpForm.patchValue({ name: 'John', email: 'john@test.com', password: 'password123' });
    expect(comp.signUpForm.valid).toBe(true);
  });

  it('should validate password minimum length', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const comp = fixture.componentInstance;

    comp.signUpForm.patchValue({ name: 'John', email: 'john@test.com', password: 'short' });
    expect(comp.signUpForm.get('password')!.hasError('minlength')).toBe(true);

    comp.signUpForm.patchValue({ password: 'longenough' });
    expect(comp.signUpForm.get('password')!.hasError('minlength')).toBe(false);
  });

  it('should not submit when form is invalid', async () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    await fixture.componentInstance.onSignUp();
    expect(mockAuthService.signUpWithEmail).not.toHaveBeenCalled();
  });

  it('should transition to pending state on sign up', async () => {
    mockAuthService.signUpWithEmail.mockResolvedValue(undefined);

    const fixture = TestBed.createComponent(SignUpComponent);
    const comp = fixture.componentInstance;
    comp.signUpForm.patchValue({ name: 'John', email: 'john@test.com', password: 'password123' });

    await comp.onSignUp();

    expect(mockAuthService.signUpWithEmail).toHaveBeenCalledWith('john@test.com', 'password123');
    expect(comp.verification().state).toBe('pending');
  });

  it('should set error on sign up failure', async () => {
    mockAuthService.signUpWithEmail.mockRejectedValue({
      errors: [{ longMessage: 'Email already taken' }],
    });

    const fixture = TestBed.createComponent(SignUpComponent);
    const comp = fixture.componentInstance;
    comp.signUpForm.patchValue({ name: 'John', email: 'john@test.com', password: 'password123' });

    await comp.onSignUp();

    expect(comp.error()).toBe('Email already taken');
  });

  it('should transition to success on verification', async () => {
    mockAuthService.verifyEmailOTP.mockResolvedValue(undefined);

    const fixture = TestBed.createComponent(SignUpComponent);
    const comp = fixture.componentInstance;
    comp.updateVerification('code', '12345');

    await comp.onVerify();

    expect(mockAuthService.verifyEmailOTP).toHaveBeenCalledWith('12345');
    expect(comp.verification().state).toBe('success');
  });

  it('should navigate to home on goHome()', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    fixture.componentInstance.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/app/home']);
  });
});
