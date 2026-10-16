import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
} from '@angular/core';
import {provideRouter} from '@angular/router';
import {inject} from '@angular/core';

import {routes} from './app.routes';
import {NativeFederationService} from './services/native-federation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const federationService = inject(NativeFederationService);
      await federationService.refreshManifest();
    }),
  ],
};
