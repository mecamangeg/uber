import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-driver-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="driver-layout">
      <div class="driver-layout__content">
        <router-outlet></router-outlet>
      </div>

      <nav class="driver-tab-bar" aria-label="Driver navigation">
        <a routerLink="dashboard" routerLinkActive="driver-tab--active" class="driver-tab">
          <span class="driver-tab__icon">&#9638;</span>
          <span class="driver-tab__label">Dashboard</span>
        </a>
        <a routerLink="rides" routerLinkActive="driver-tab--active" class="driver-tab">
          <span class="driver-tab__icon">&#9670;</span>
          <span class="driver-tab__label">Rides</span>
        </a>
        <a routerLink="earnings" routerLinkActive="driver-tab--active" class="driver-tab">
          <span class="driver-tab__icon">&#9733;</span>
          <span class="driver-tab__label">Earnings</span>
        </a>
        <a routerLink="profile" routerLinkActive="driver-tab--active" class="driver-tab">
          <span class="driver-tab__icon">&#9679;</span>
          <span class="driver-tab__label">Profile</span>
        </a>
      </nav>
    </div>
  `,
  styleUrl: './driver-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverLayoutComponent {}
