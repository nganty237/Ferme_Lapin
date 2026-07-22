import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    redirectTo: 'accueil',
    pathMatch: 'full',
  },
  {
    path: 'accueil',
    loadComponent: () =>
      import('./pages/accueil.component').then((m) => m.AccueilComponent),
  },
  {
    path: 'occupation-cages',
    loadComponent: () =>
      import('./pages/occupation-cages.component').then(
        (m) => m.OccupationCagesComponent
      ),
  },
  {
    path: 'previsions',
    loadComponent: () =>
      import('./pages/previsions.component').then((m) => m.PrevisionsComponent),
  },
  {
    path: 'projection',
    loadComponent: () =>
      import('./pages/projection.component').then((m) => m.ProjectionComponent),
  },
  {
    path: 'optimisation',
    loadComponent: () =>
      import('./pages/optimisation.component').then(
        (m) => m.OptimisationComponent
      ),
  },
  {
    path: 'rentabilite',
    loadComponent: () =>
      import('./pages/rentabilite.component').then(
        (m) => m.RentabiliteComponent
      ),
  },
];
