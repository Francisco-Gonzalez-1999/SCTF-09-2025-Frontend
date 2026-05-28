import { Routes } from '@angular/router';

export const contabilidadElectronicaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.ConeDashboardComponent)
  },
  {
    path: 'cuentas-sin-agrupador',
    loadComponent: () =>
      import('./pages/cuentas-sin-agrupador/cuentas-sin-agrupador.component')
        .then(m => m.CuentasSinAgrupadorComponent)
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionConeComponent)
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/historial/historial.component').then(m => m.HistorialGeneracionesComponent)
  },
  {
    path: 'generar/:tipo',
    loadComponent: () =>
      import('./pages/wizard-generacion/wizard-generacion.component')
        .then(m => m.WizardGeneracionComponent)
  }
];
