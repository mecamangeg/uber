import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { AdminService } from '@core/services/admin.service';
import type { Ride } from '@models/ride.model';

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
                <th>Ride Status</th>
                <th>Payment</th>
                <th>Actions</th>
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
                    <span class="badge" [class]="'badge--' + (ride.status || 'pending')">
                      {{ statusLabel(ride) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class]="'badge--' + ride.payment_status">
                      {{ ride.payment_status }}
                    </span>
                  </td>
                  <td class="cell-actions">
                    @if (canCancel(ride)) {
                      <button class="action-btn action-btn--danger" (click)="onCancel(ride)">Cancel</button>
                    }
                    @if (ride.payment_status === 'pending' && ride.status !== 'cancelled' && ride.status !== 'driver_cancelled') {
                      <button class="action-btn action-btn--success" (click)="onMarkPaid(ride)">Mark Paid</button>
                    }
                    @if (ride.payment_status === 'paid') {
                      <button class="action-btn action-btn--warn" (click)="onRefund(ride)">Refund</button>
                    }
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

  statusLabel(ride: Ride): string {
    const labels: Record<string, string> = {
      pending: 'Pending', accepted: 'Accepted', en_route_pickup: 'En Route',
      arrived_pickup: 'Arrived', in_progress: 'In Progress',
      completed: 'Completed', cancelled: 'Cancelled', driver_cancelled: 'Driver Cancelled',
    };
    return labels[ride.status] || ride.status || 'Pending';
  }

  canCancel(ride: Ride): boolean {
    const s = ride.status || 'pending';
    return s !== 'completed' && s !== 'cancelled' && s !== 'driver_cancelled';
  }

  async onCancel(ride: Ride) {
    if (!confirm(`Cancel ride #${ride.ride_id}?`)) return;
    await this.admin.updateRideStatus(ride.ride_id!, 'cancelled', 'admin');
  }

  async onMarkPaid(ride: Ride) {
    await this.admin.markRidePaid(ride.ride_id!);
  }

  async onRefund(ride: Ride) {
    if (!confirm(`Refund ride #${ride.ride_id}?`)) return;
    await this.admin.updateRideStatus(ride.ride_id!, 'refunded', 'admin');
  }
}
