import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'bandes',
    loadComponent: () => import('./features/bandes/bandes.component').then(m => m.BandesComponent)
  },
  {
    path: 'production',
    loadComponent: () => import('./features/production/production.component').then(m => m.ProductionComponent)
  },
  {
    path: 'ventes',
    loadComponent: () => import('./features/ventes/ventes.component').then(m => m.VentesComponent)
  },
  {
    path: 'rapports',
    loadComponent: () => import('./features/rapports/rapports.component').then(m => m.RapportsComponent)
  },
  {
    path: 'parametres',
    loadComponent: () => import('./features/parametres/parametres.component').then(m => m.ParametresComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
