import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { NativeFederationService } from './services/native-federation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular v21+ defaults to zoneless; keep it explicit and avoid zone.js.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const federationService = inject(NativeFederationService);
      await federationService.refreshManifest();
    }),
  ],
};
