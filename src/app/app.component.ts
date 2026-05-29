import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  private readonly authService = inject(AuthService);
  private redirectSub?: Subscription;

  ngOnInit() {
    this.redirectSub = this.authService.handleRedirectCallback();
  }

  ngOnDestroy() {
    this.redirectSub?.unsubscribe();
  }
}
