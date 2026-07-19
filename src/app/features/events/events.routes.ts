import { Routes } from '@angular/router';

export const eventsRoutes: Routes = [
  {
    path: 'saillies',
    loadComponent: () =>
      import('./pages/saisie-saillie.component').then(
        (m) => m.SaisieSaillieComponent
      ),
  },
  {
    path: 'mises-bas',
    loadComponent: () =>
      import('./pages/saisie-mise-bas.component').then(
        (m) => m.SaisieMiseBasComponent
      ),
  },
  {
    path: 'sevrages',
    loadComponent: () =>
      import('./pages/saisie-sevrage.component').then(
        (m) => m.SaisieSevrageComponent
      ),
  },
  {
    path: 'ventes',
    loadComponent: () =>
      import('./pages/saisie-vente.component').then(
        (m) => m.SaisieVenteComponent
      ),
  },
  {
    path: 'deces',
    loadComponent: () =>
      import('./pages/saisie-deces.component').then(
        (m) => m.SaisieDecesComponent
      ),
  },
];
