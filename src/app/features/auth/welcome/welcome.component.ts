import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { AuthService } from '@core/services/auth.service';

const onboarding = [
  {
    id: 1,
    title: 'The perfect ride is just a tap away!',
    description: 'Your journey begins with Ryde. Find your ideal ride effortlessly.',
    image: 'assets/images/onboarding1.png',
  },
  {
    id: 2,
    title: 'Best car in your hands with Ryde',
    description: 'Discover the convenience of finding your perfect ride with Ryde',
    image: 'assets/images/onboarding2.png',
  },
  {
    id: 3,
    title: 'Your ride, your way. Let\'s go!',
    description: 'Enter your destination, sit back, and let us take care of the rest.',
    image: 'assets/images/onboarding3.png',
  },
];

@Component({
  selector: 'app-welcome',
  imports: [CustomButtonComponent],
  template: `
    <div class="welcome">
      <button class="welcome__skip" (click)="skip()">Skip</button>

      <div class="welcome__swiper">
        <div class="welcome__slide">
          <img [src]="currentSlide().image" class="welcome__image" alt="Onboarding" />
          <h2 class="welcome__title">{{ currentSlide().title }}</h2>
          <p class="welcome__desc">{{ currentSlide().description }}</p>
        </div>

        <div class="welcome__dots">
          @for (slide of slides; track slide.id) {
            <span class="welcome__dot" [class.welcome__dot--active]="slide.id === currentSlide().id"></span>
          }
        </div>
      </div>

      <div class="welcome__action">
        <app-custom-button
          [title]="isLastSlide() ? 'Get Started' : 'Next'"
          (pressed)="onNext()"
        />
      </div>
    </div>
  `,
  styleUrl: './welcome.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WelcomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly slides = onboarding;
  readonly activeIndex = signal(0);
  readonly currentSlide = computed(() => this.slides[this.activeIndex()]);
  readonly isLastSlide = computed(() => this.activeIndex() === this.slides.length - 1);

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/app/home']);
    }
  }

  skip() {
    this.router.navigate(['/auth/sign-up']);
  }

  onNext() {
    if (this.isLastSlide()) {
      this.router.navigate(['/auth/sign-up']);
    } else {
      this.activeIndex.update(i => i + 1);
    }
  }
}
