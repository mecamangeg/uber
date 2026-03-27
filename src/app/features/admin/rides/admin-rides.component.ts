import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-admin-rides',
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="admin-page">
      <h2 class="admin-page__title">Rides</h2>

      @if (admin.isLoading()) {
        <div class="admin-loading"><div class="spinner"></div></div>
      } @else if (admin.rides().length === 0) {
        <div class="admin-empty"><p>No rides recorded yet.</p></div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Driver</th>
                <th>Fare</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (ride of admin.rides(); track ride.ride_id) {
                <tr>
                  <td class="cell-muted">{{ ride.ride_id }}</td>
                  <td>{{ ride.created_at | date:'mediumDate' }}</td>
                  <td class="cell-truncate" [title]="ride.origin_address">{{ ride.origin_address }}</td>
                  <td class="cell-truncate" [title]="ride.destination_address">{{ ride.destination_address }}</td>
                  <td>
                    @if (ride.driver) {
                      {{ ride.driver.first_name }} {{ ride.driver.last_name }}
                    } @else {
                      <span class="cell-muted">--</span>
                    }
                  </td>
                  <td class="cell-fare">{{ ride.fare_price | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class]="'badge--' + ride.payment_status">
                      {{ ride.payment_status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-rides.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminRidesComponent implements OnInit {
  readonly admin = inject(AdminService);

  ngOnInit() {
    this.admin.loadRides();
  }
}
