import { Injectable } from '@angular/core';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loaded = false;

  load(): Promise<void> {
    if (this.loaded || typeof document === 'undefined') return Promise.resolve();

    const apiKey = environment.googleMapsApiKey;
    if (!apiKey || apiKey === '...') return Promise.resolve();

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.loaded = true;
        resolve();
      };
      script.onerror = () => resolve(); // don't block app startup
      document.head.appendChild(script);
    });
  }
}
