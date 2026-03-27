import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-tab-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="tab-layout">
      <div class="tab-layout__content">
        <router-outlet></router-outlet>
      </div>

      <nav class="tab-bar" aria-label="Main navigation">
        <a routerLink="home" routerLinkActive="tab-bar__item--active" class="tab-bar__item" aria-label="Home">
          <div class="tab-bar__icon-wrap">
            <img src="assets/icons/home.png" class="tab-bar__icon" alt="" />
          </div>
        </a>
        <a routerLink="rides" routerLinkActive="tab-bar__item--active" class="tab-bar__item" aria-label="Rides">
          <div class="tab-bar__icon-wrap">
            <img src="assets/icons/list.png" class="tab-bar__icon" alt="" />
          </div>
        </a>
        <a routerLink="chat" routerLinkActive="tab-bar__item--active" class="tab-bar__item" aria-label="Chat">
          <div class="tab-bar__icon-wrap">
            <img src="assets/icons/chat.png" class="tab-bar__icon" alt="" />
          </div>
        </a>
        <a routerLink="profile" routerLinkActive="tab-bar__item--active" class="tab-bar__item" aria-label="Profile">
          <div class="tab-bar__icon-wrap">
            <img src="assets/icons/profile.png" class="tab-bar__icon" alt="" />
          </div>
        </a>
      </nav>
    </div>
  `,
  styleUrl: './tab-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TabLayoutComponent {}
