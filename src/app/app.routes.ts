import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'uat',
    loadComponent: () =>
      import('./components/apps/uat-portal/uat-portal.component').then((m) => m.UatPortalComponent),
  },
];
