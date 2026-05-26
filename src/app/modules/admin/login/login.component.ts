// UsosDelComponente
import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// ImportacionesParaPrimeNg
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Servicios
import { LayoutService } from '../../layout/components/layout/service/app.layout.service';
import { AuthService } from '../services/auth.service';

// Azure
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    DividerModule,
    ProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  valCheck: string[] = ['remember'];
  password!: string;
  private authSubscription?: Subscription;

  constructor(
    public layoutService: LayoutService,
    public authService: AuthService
  ) {}

  loginWithMicrosoft() {
    this.authService.loginWithPopup();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
