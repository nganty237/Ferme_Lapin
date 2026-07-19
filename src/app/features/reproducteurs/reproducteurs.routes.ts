import { Routes } from '@angular/router';

export const reproducteursRoutes: Routes = [
  {
    path: '',
    redirectTo: 'femelles',
    pathMatch: 'full',
  },
  {
    path: 'femelles',
    loadComponent: () =>
      import('./pages/liste-femelles.component').then(
        (m) => m.ListeFemellesComponent
      ),
  },
  {
    path: 'males',
    loadComponent: () =>
      import('./pages/liste-males.component').then(
        (m) => m.ListeMalesComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/fiche-reproducteur.component').then(
        (m) => m.FicheReproducteurComponent
      ),
  },
];
