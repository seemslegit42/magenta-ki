import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'uat',
    loadComponent: () =>
      import('./components/apps/uat-portal/uat-portal.component').then((m) => m.UatPortalComponent),
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./components/apps/feedback-hub/feedback-hub.component').then((m) => m.FeedbackHubComponent),
  },
];
