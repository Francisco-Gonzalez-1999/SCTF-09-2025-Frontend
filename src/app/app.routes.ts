import { Routes } from '@angular/router';
import { LayoutComponent } from './modules/layout/components/layout/layout.component';
import { isLoggedIn, isNotLoggedIn } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [isLoggedIn],
    children: [
      {
        path: '',
        redirectTo: 'contabilidad-electronica',
        pathMatch: 'full'
      },
      {
        path: 'contabilidad-electronica',
        loadChildren: () =>
          import('./modules/contabilidad-electronica/contabilidad-electronica.routing')
            .then(m => m.contabilidadElectronicaRoutes)
      },
      {
        path: 'pagos-sit',
        loadChildren: () =>
          import('./modules/pagos-sit/pagos-sit.routing').then(m => m.pagosSitRoutes)
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/admin/auth.routing').then(m => m.authRoutes),
    canActivate: [isNotLoggedIn]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
