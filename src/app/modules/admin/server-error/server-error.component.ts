import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { HttpClientService } from '../../../shared/services/http-client.service';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [
    ButtonModule,
    RouterLink
  ],
  templateUrl: './server-error.component.html',
  styleUrl: './server-error.component.scss'
})
export class ServerErrorComponent implements OnInit{

  private intervalId: any;

  constructor(
    private router: Router,
    private HttpClientService: HttpClientService
  ){

  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.checkConnection();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  reloadComponent() {
    window.location.reload();
  }

  checkConnection(){
    this.HttpClientService.get<any>('Health/GetHealth').subscribe({
      next: () => {
        this.router.navigate(['/'])
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
      },
      error(err) {
        // console.log("ERROR: ", err)
      },
    })
  }

}
