import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `
    <div class="admin-page">
      <h2 class="admin-page__title">Dashboard</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card__value">{{ admin.stats().totalDrivers }}</span>
          <span class="stat-card__label">Drivers</span>
          <a routerLink="../drivers" class="stat-card__link">Manage &rarr;</a>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ admin.stats().totalRides }}</span>
          <span class="stat-card__label">Total Rides</span>
          <a routerLink="../rides" class="stat-card__link">View &rarr;</a>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ admin.stats().totalUsers }}</span>
          <span class="stat-card__label">Users</span>
          <a routerLink="../users" class="stat-card__link">View &rarr;</a>
        </div>
        <div class="stat-card stat-card--accent">
          <span class="stat-card__value">{{ formatCurrency(admin.stats().totalRevenue) }}</span>
          <span class="stat-card__label">Total Revenue</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminDashboardComponent implements OnInit {
  readonly admin = inject(AdminService);

  ngOnInit() {
    this.admin.loadStats();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  }
}
