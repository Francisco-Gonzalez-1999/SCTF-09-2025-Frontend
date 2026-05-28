import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { AuthService } from './modules/admin/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SCTF-09-2025-Frontend';

  private readonly msalService = inject(MsalService);
  private readonly authService = inject(AuthService);
  private redirectSub?: Subscription;

  async ngOnInit() {
    try {
      // Inicializa MSAL (lee cache, prepara cliente publico).
      await this.msalService.initialize();

      // Procesa el callback de loginRedirect si la URL actual viene de
      // Microsoft (trae el code en el hash). Si es un load normal, no hace nada.
      this.redirectSub = this.authService.handleRedirectCallback();
    } catch (error) {
      console.error('[MSAL] Inicializacion fallida:', error);
    }
  }

  ngOnDestroy() {
    this.redirectSub?.unsubscribe();
  }
}
