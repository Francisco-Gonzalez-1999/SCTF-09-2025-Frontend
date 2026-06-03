import { Routes } from '@angular/router';

export const pagosSitRoutes: Routes = [
  {
    path: '',
    redirectTo: 'captura-pdv',
    pathMatch: 'full'
  },
  {
    path: 'captura-pdv',
    loadComponent: () =>
      import('./pages/captura-pdv/captura-pdv.component').then(m => m.CapturaPdvComponent)
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/historial/historial.component').then(m => m.SitHistorialComponent)
  }
];
