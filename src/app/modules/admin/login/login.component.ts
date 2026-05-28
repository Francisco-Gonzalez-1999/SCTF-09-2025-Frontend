import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  /** Año actual, para el footer */
  readonly anioActual = new Date().getFullYear();

  /** Estado del loading del flujo MSAL (popup) */
  cargando = signal(false);

  private loadingSub?: Subscription;

  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Cuando AuthService.loginWithPopup() empieza, isLoading=true; cuando termina, false.
    this.loadingSub = this.authService.isLoading.subscribe(v => this.cargando.set(v));
  }

  loginWithMicrosoft() {
    if (this.cargando()) return;
    this.authService.loginRedirect();
  }

  ngOnDestroy() {
    this.loadingSub?.unsubscribe();
  }
}
