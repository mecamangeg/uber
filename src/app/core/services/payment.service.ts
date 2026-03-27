import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly paymentStatus = signal<'idle' | 'pending' | 'paid' | 'failed'>('idle');
  readonly isProcessing = signal(false);

  async payForRide(rideId: number, fareAmount: number): Promise<string> {
    this.isProcessing.set(true);
    this.paymentStatus.set('pending');

    if (environment.devBypassAuth) {
      // Simulate payment in dev mode
      await new Promise(r => setTimeout(r, 1000));
      this.paymentStatus.set('paid');
      this.isProcessing.set(false);
      return 'dev_ref_' + Date.now();
    }

    try {
      const headers = await this.authHeaders();

      const resp = await firstValueFrom(
        this.http.post<{ redirect_url: string; reference_id: string }>(
          `${environment.apiUrl}/api/payments/create`,
          { ride_id: rideId, fare_amount: fareAmount },
          { headers }
        )
      );

      if (!resp.redirect_url) throw new Error('No checkout URL');

      window.open(resp.redirect_url, '_blank');
      return resp.reference_id;
    } catch (e) {
      this.paymentStatus.set('failed');
      this.isProcessing.set(false);
      throw e;
    }
  }

  async confirmPayment(referenceId: string): Promise<void> {
    if (environment.devBypassAuth) {
      this.paymentStatus.set('paid');
      this.isProcessing.set(false);
      return;
    }

    try {
      const headers = await this.authHeaders();
      const maxAttempts = 10;
      const pollInterval = 3000;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, pollInterval));
        const resp = await firstValueFrom(
          this.http.post<{ status: string }>(
            `${environment.apiUrl}/api/payments/confirm`,
            { reference_id: referenceId },
            { headers }
          )
        );

        if (resp.status === 'paid' || resp.status === 'credited') {
          this.paymentStatus.set('paid');
          this.isProcessing.set(false);
          return;
        }
      }

      // Timed out waiting for payment confirmation
      this.paymentStatus.set('failed');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async authHeaders(): Promise<HttpHeaders> {
    const token = await this.auth.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
