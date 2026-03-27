import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '@core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe],
  template: `
    <div class="admin-page">
      <h2 class="admin-page__title">Users</h2>

      @if (admin.isLoading()) {
        <div class="admin-loading"><div class="spinner"></div></div>
      } @else if (admin.users().length === 0) {
        <div class="admin-empty"><p>No registered users yet.</p></div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Clerk ID</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (user of admin.users(); track user.id) {
                <tr>
                  <td class="cell-muted">{{ user.id }}</td>
                  <td class="cell-name">{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td class="cell-muted">{{ user.clerk_id }}</td>
                  <td>{{ user.created_at | date:'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AdminUsersComponent implements OnInit {
  readonly admin = inject(AdminService);

  ngOnInit() {
    this.admin.loadUsers();
  }
}
