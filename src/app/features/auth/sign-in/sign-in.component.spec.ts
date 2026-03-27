import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import SignInComponent from './sign-in.component';
import { AuthService } from '@core/services/auth.service';

describe('SignInComponent', () => {
  let mockAuthService: { signInWithEmail: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      signInWithEmail: vi.fn(),
    };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SignInComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    const fixture = TestBed.createComponent(SignInComponent);
    const comp = fixture.componentInstance;
    expect(comp.form.value).toEqual({ email: '', password: '' });
    expect(comp.error()).toBe('');
  });

  it('should mark form as invalid when empty', () => {
    const fixture = TestBed.createComponent(SignInComponent);
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('should validate email format', () => {
    const fixture = TestBed.createComponent(SignInComponent);
    const comp = fixture.componentInstance;

    comp.form.patchValue({ email: 'not-an-email', password: 'secret' });
    expect(comp.form.get('email')!.hasError('email')).toBe(true);

    comp.form.patchValue({ email: 'test@test.com' });
    expect(comp.form.get('email')!.hasError('email')).toBe(false);
  });

  it('should not submit when form is invalid', async () => {
    const fixture = TestBed.createComponent(SignInComponent);
    await fixture.componentInstance.onSignIn();
    expect(mockAuthService.signInWithEmail).not.toHaveBeenCalled();
  });

  it('should navigate to home on successful sign in', async () => {
    mockAuthService.signInWithEmail.mockResolvedValue({ status: 'complete' });

    const fixture = TestBed.createComponent(SignInComponent);
    const comp = fixture.componentInstance;
    comp.form.patchValue({ email: 'test@test.com', password: 'secret' });

    await comp.onSignIn();

    expect(mockAuthService.signInWithEmail).toHaveBeenCalledWith('test@test.com', 'secret');
    expect(router.navigate).toHaveBeenCalledWith(['/app/home']);
  });

  it('should display error on failed sign in', async () => {
    mockAuthService.signInWithEmail.mockResolvedValue({ status: 'needs_first_factor' });

    const fixture = TestBed.createComponent(SignInComponent);
    const comp = fixture.componentInstance;
    comp.form.patchValue({ email: 'test@test.com', password: 'secret' });

    await comp.onSignIn();

    expect(comp.error()).toBe('Sign in failed. Please try again.');
  });

  it('should display Clerk error message on exception', async () => {
    mockAuthService.signInWithEmail.mockRejectedValue({
      errors: [{ longMessage: 'Invalid credentials' }],
    });

    const fixture = TestBed.createComponent(SignInComponent);
    const comp = fixture.componentInstance;
    comp.form.patchValue({ email: 'test@test.com', password: 'wrong' });

    await comp.onSignIn();

    expect(comp.error()).toBe('Invalid credentials');
  });

  it('should render email and password form fields with proper labels', async () => {
    const fixture = TestBed.createComponent(SignInComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('label[for="signin-email"]')).toBeTruthy();
    expect(el.querySelector('label[for="signin-password"]')).toBeTruthy();
    expect(el.querySelector('#signin-email')).toBeTruthy();
    expect(el.querySelector('#signin-password')).toBeTruthy();
  });
});
