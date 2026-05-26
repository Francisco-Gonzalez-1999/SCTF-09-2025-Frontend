import { Component, ElementRef } from '@angular/core';
import { LayoutService } from '../layout/service/app.layout.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [
    MenuComponent
  ],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  constructor(public layoutService: LayoutService, public el: ElementRef) { }
}
