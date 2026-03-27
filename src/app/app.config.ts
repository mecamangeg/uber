import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { GoogleMapsLoaderService } from './core/services/google-maps-loader.service';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { provideServiceWorker } from '@angular/service-worker';

function initializeClerk(auth: AuthService) {
  return () => auth.initialize();
}

function initializeGoogleMaps(loader: GoogleMapsLoaderService) {
  return () => loader.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeClerk,
      deps: [AuthService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeGoogleMaps,
      deps: [GoogleMapsLoaderService],
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
