import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import WelcomeComponent from './welcome.component';

describe('WelcomeComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start on first slide', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    const comp = fixture.componentInstance;
    expect(comp.activeIndex()).toBe(0);
    expect(comp.isLastSlide()).toBe(false);
  });

  it('should advance to next slide on onNext()', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    const comp = fixture.componentInstance;

    comp.onNext();
    expect(comp.activeIndex()).toBe(1);

    comp.onNext();
    expect(comp.activeIndex()).toBe(2);
    expect(comp.isLastSlide()).toBe(true);
  });

  it('should navigate to sign-up on last slide next', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    const comp = fixture.componentInstance;

    comp.onNext(); // 0 -> 1
    comp.onNext(); // 1 -> 2
    comp.onNext(); // last slide -> navigate

    expect(router.navigate).toHaveBeenCalledWith(['/auth/sign-up']);
  });

  it('should navigate to sign-up on skip', () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.componentInstance.skip();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/sign-up']);
  });

  it('should render current slide title', async () => {
    const fixture = TestBed.createComponent(WelcomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.welcome__title')?.textContent).toContain('The perfect ride');
  });
});
