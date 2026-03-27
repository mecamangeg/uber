import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar__header">
          <h1 class="admin-sidebar__title">Ryde Admin</h1>
        </div>

        <nav class="admin-sidebar__nav" aria-label="Admin navigation">
          <a routerLink="dashboard" routerLinkActive="admin-nav__link--active" class="admin-nav__link">
            <span class="admin-nav__icon">&#9638;</span>
            Dashboard
          </a>
          <a routerLink="drivers" routerLinkActive="admin-nav__link--active" class="admin-nav__link">
            <span class="admin-nav__icon">&#9951;</span>
            Drivers
          </a>
          <a routerLink="rides" routerLinkActive="admin-nav__link--active" class="admin-nav__link">
            <span class="admin-nav__icon">&#9670;</span>
            Rides
          </a>
          <a routerLink="users" routerLinkActive="admin-nav__link--active" class="admin-nav__link">
            <span class="admin-nav__icon">&#9679;</span>
            Users
          </a>
        </nav>

        <div class="admin-sidebar__footer">
          <button class="admin-nav__link admin-nav__link--back" (click)="goToApp()">
            &larr; Back to App
          </button>
        </div>
      </aside>

      <main class="admin-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './admin-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminLayoutComponent {
  private readonly router = inject(Router);

  goToApp() {
    this.router.navigate(['/app/home']);
  }
}
