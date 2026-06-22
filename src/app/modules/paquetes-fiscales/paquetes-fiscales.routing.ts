import { Routes } from '@angular/router';

export const paquetesFiscalesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'generar',
    pathMatch: 'full'
  },
  {
    path: 'generar',
    loadComponent: () =>
      import('./pages/generar/generar.component').then(m => m.GenerarPaqueteComponent)
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/historial/historial.component').then(m => m.HistorialPaquetesComponent)
  }
];
