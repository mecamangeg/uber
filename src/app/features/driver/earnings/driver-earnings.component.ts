import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { DriverPortalService } from '@core/services/driver-portal.service';
import { EarningsCardComponent } from '@shared/components/earnings-card/earnings-card.component';

@Component({
  selector: 'app-driver-earnings',
  imports: [DatePipe, DecimalPipe, EarningsCardComponent],
  template: `
    <div class="driver-page">
      <h2 class="driver-page__title">Earnings</h2>

      <div class="earnings-cards">
        <app-earnings-card label="Today" [amount]="portal.earnings().today" />
        <app-earnings-card label="This Week" [amount]="portal.earnings().week" />
        <app-earnings-card label="Total" [amount]="portal.earnings().total" />
      </div>

      <h3 class="section-title">Recent Payouts</h3>
      @if (portal.isLoading()) {
        <div class="driver-page__loading"><div class="spinner"></div></div>
      } @else if (portal.earningsHistory().length === 0) {
        <div class="driver-page__empty"><p>No earnings yet. Complete rides to start earning.</p></div>
      } @else {
        <div class="earnings-list">
          @for (item of portal.earningsHistory(); track item.id) {
            <div class="earnings-item">
              <div class="earnings-item__route">
                {{ item.origin_address || 'Ride' }} &rarr; {{ item.destination_address || '#' + item.ride_id }}
              </div>
              <div class="earnings-item__meta">
                <span>{{ item.created_at | date:'mediumDate' }}</span>
                <span class="earnings-item__amount">PHP {{ item.net_amount | number:'1.2-2' }}</span>
                <span class="earnings-item__commission">(- {{ item.commission | number:'1.2-2' }})</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .driver-page { padding: 24px 20px; max-width: 600px; margin: 0 auto; }
    .driver-page__title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 24px; }
    .driver-page__loading { display: flex; justify-content: center; padding: 48px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #f5a623; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .driver-page__empty { text-align: center; padding: 48px; color: #999; background: #fff; border-radius: 12px; }
    .earnings-cards { display: flex; gap: 12px; margin-bottom: 28px; }
    .section-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 16px; }
    .earnings-list { display: flex; flex-direction: column; gap: 10px; }
    .earnings-item { background: #fff; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .earnings-item__route { font-size: 14px; color: #333; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .earnings-item__meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #718096; }
    .earnings-item__amount { font-weight: 700; color: #48bb78; font-family: monospace; }
    .earnings-item__commission { font-size: 12px; color: #a0aec0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DriverEarningsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly portal = inject(DriverPortalService);

  async ngOnInit() {
    const clerkId = this.auth.user()?.id;
    if (!clerkId) return;
    await this.portal.loadProfile(clerkId);
    const profile = this.portal.profile();
    if (profile) {
      this.portal.loadEarnings(profile.id);
      this.portal.loadEarningsHistory(profile.id);
    }
  }
}
