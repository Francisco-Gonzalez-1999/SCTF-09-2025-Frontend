import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Primeng17_FrontEnd_Template';

  constructor(private msalService: MsalService) {}

  async ngOnInit() {
    try {
      await this.msalService.initialize();
      // console.log('MSAL initialized successfully');
    } catch (error) {
      // console.error('MSAL initialization failed', error);
    } finally {
      // this.isInitializing = false;
    }
  }

}
