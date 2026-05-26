// Importaciones para uso del componente
import { Component } from '@angular/core';
import { LayoutService } from '../layout/service/app.layout.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  constructor(public layoutService: LayoutService) { }
}
