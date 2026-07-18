import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/accueil',
    pathMatch: 'full',
  },

  // ── Dashboards ──
  {
    path: 'dashboard',
    redirectTo: 'dashboard/accueil',
    pathMatch: 'full',
  },
  {
    path: 'dashboard/accueil',
    loadComponent: () =>
      import('./pages/dashboard/accueil.component').then(
        (m) => m.AccueilComponent
      ),
  },
  {
    path: 'dashboard/occupation-cages',
    loadComponent: () =>
      import('./pages/dashboard/occupation-cages.component').then(
        (m) => m.OccupationCagesComponent
      ),
  },
  {
    path: 'dashboard/previsions',
    loadComponent: () =>
      import('./pages/dashboard/previsions.component').then(
        (m) => m.PrevisionsComponent
      ),
  },
  {
    path: 'dashboard/projection',
    loadComponent: () =>
      import('./pages/dashboard/projection.component').then(
        (m) => m.ProjectionComponent
      ),
  },
  {
    path: 'dashboard/optimisation',
    loadComponent: () =>
      import('./pages/dashboard/optimisation.component').then(
        (m) => m.OptimisationComponent
      ),
  },
  {
    path: 'dashboard/rentabilite',
    loadComponent: () =>
      import('./pages/dashboard/rentabilite.component').then(
        (m) => m.RentabiliteComponent
      ),
  },

  // ── Reproducteurs ──
  {
    path: 'reproducteurs',
    redirectTo: 'reproducteurs/femelles',
    pathMatch: 'full',
  },
  {
    path: 'reproducteurs/femelles',
    loadComponent: () =>
      import('./pages/reproducteurs/liste-femelles.component').then(
        (m) => m.ListeFemellesComponent
      ),
  },
  {
    path: 'reproducteurs/males',
    loadComponent: () =>
      import('./pages/reproducteurs/liste-males.component').then(
        (m) => m.ListeMalesComponent
      ),
  },
  {
    path: 'reproducteurs/:id',
    loadComponent: () =>
      import('./pages/reproducteurs/fiche-reproducteur.component').then(
        (m) => m.FicheReproducteurComponent
      ),
  },

  // ── Événements (saisie) ──
  {
    path: 'saillies',
    loadComponent: () =>
      import('./pages/events/saisie-saillie.component').then(
        (m) => m.SaisieSaillieComponent
      ),
  },
  {
    path: 'mises-bas',
    loadComponent: () =>
      import('./pages/events/saisie-mise-bas.component').then(
        (m) => m.SaisieMiseBasComponent
      ),
  },
  {
    path: 'sevrages',
    loadComponent: () =>
      import('./pages/events/saisie-sevrage.component').then(
        (m) => m.SaisieSevrageComponent
      ),
  },
  {
    path: 'ventes',
    loadComponent: () =>
      import('./pages/events/saisie-vente.component').then(
        (m) => m.SaisieVenteComponent
      ),
  },
  {
    path: 'deces',
    loadComponent: () =>
      import('./pages/events/saisie-deces.component').then(
        (m) => m.SaisieDecesComponent
      ),
  },

  // ── Paramètres ──
  {
    path: 'parametres',
    loadComponent: () =>
      import('./pages/parametres/config.component').then(
        (m) => m.ConfigComponent
      ),
  },

  // ── Fallback ──
  {
    path: '**',
    redirectTo: 'dashboard/accueil',
  },
];
