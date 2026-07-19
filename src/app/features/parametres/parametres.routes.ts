import { Routes } from '@angular/router';

export const parametresRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/config.component').then((m) => m.ConfigComponent),
  },
];
