import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'SCTF-09-2025-Frontend';

  constructor(private msalService: MsalService) {}

  async ngOnInit() {
    try {
      await this.msalService.initialize();
    } catch (error) {
      // MSAL init handled by error boundary above
    }
  }
}
