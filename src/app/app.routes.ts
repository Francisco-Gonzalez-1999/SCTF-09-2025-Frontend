import { Routes } from '@angular/router';
import { LayoutComponent } from './modules/layout/components/layout/layout.component';
import { isLoggedIn, isNotLoggedIn } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent
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
