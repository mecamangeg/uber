import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { InputFieldComponent } from '@shared/components/input-field/input-field.component';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [InputFieldComponent],
  template: `
    <div class="profile">
      <h2 class="profile__title">My profile</h2>

      <div class="profile__avatar-container">
        <img [src]="avatarUrl()" class="profile__avatar" alt="Profile" />
      </div>

      <div class="profile__card">
        <app-input-field
          label="First name"
          [placeholder]="firstName()"
          [disabled]="true"
        />
        <app-input-field
          label="Last name"
          [placeholder]="lastName()"
          [disabled]="true"
        />
        <app-input-field
          label="Email"
          [placeholder]="email()"
          [disabled]="true"
        />
        <app-input-field
          label="Phone"
          [placeholder]="phone()"
          [disabled]="true"
        />
      </div>
    </div>
  `,
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly firstName = signal('Not Found');
  readonly lastName = signal('Not Found');
  readonly email = signal('Not Found');
  readonly phone = signal('Not Found');
  readonly avatarUrl = signal('assets/icons/profile.png');

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.firstName.set(user.firstName || 'Not Found');
      this.lastName.set(user.lastName || 'Not Found');
      this.email.set(user.primaryEmailAddress?.emailAddress || 'Not Found');
      this.phone.set(user.primaryPhoneNumber?.phoneNumber || 'Not Found');
      this.avatarUrl.set(user.imageUrl || 'assets/icons/profile.png');
    }
  }
}
