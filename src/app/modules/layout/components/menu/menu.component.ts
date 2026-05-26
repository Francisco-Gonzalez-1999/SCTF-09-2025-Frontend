import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from '../layout/service/app.layout.service';
import { AppMenuitemComponent } from './app.menuitem.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    AppMenuitemComponent,
    CommonModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {

  model: any[] = [];

  constructor(public layoutService: LayoutService) { }

  ngOnInit() {
    this.model = [
        {
          label: 'Menu1',
          items: [
            { label: 'Sub-menu1', icon: 'pi pi-fw pi-calculator', routerLink: ['/'] }
          ]
        },
        {
          label: 'Menu2',
          items: [
            { label: 'Sub-menu2', icon: 'pi pi-fw pi-file-edit', routerLink: ['/m1']  },
          ]
        },


    ];
  }

}
