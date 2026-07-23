import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('@features/auth/login/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('@layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard/accueil',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then(
            (m) => m.dashboardRoutes
          ),
      },
      {
        path: 'reproducteurs',
        loadChildren: () =>
          import('@features/reproducteurs/reproducteurs.routes').then(
            (m) => m.reproducteursRoutes
          ),
      },

      {
        path: 'evenements',
        loadChildren: () =>
          import('@features/events/events.routes').then((m) => m.eventsRoutes),
      },
      {
        path: 'parametres',
        loadChildren: () =>
          import('@features/parametres/parametres.routes').then(
            (m) => m.parametresRoutes
          ),
      },
      {
        path: '**',
        redirectTo: 'dashboard/accueil',
      },
    ],
  },
];
