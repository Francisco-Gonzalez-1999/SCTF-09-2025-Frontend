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
        label: 'Contabilidad Electronica',
        items: [
          { label: 'Inicio',                icon: 'pi pi-fw pi-home',                  routerLink: ['/contabilidad-electronica'] },
          { label: 'Cuentas sin agrupador', icon: 'pi pi-fw pi-exclamation-triangle',  routerLink: ['/contabilidad-electronica/cuentas-sin-agrupador'] },
          { label: 'Configuracion',         icon: 'pi pi-fw pi-cog',                   routerLink: ['/contabilidad-electronica/configuracion'] },
          { label: 'Historial',             icon: 'pi pi-fw pi-history',               routerLink: ['/contabilidad-electronica/historial'] }
        ]
      },
      {
        label: 'Pagos BBVA (SIT)',
        items: [
          { label: 'Pago en Ventanilla', icon: 'pi pi-fw pi-money-bill', routerLink: ['/pagos-sit/captura-pdv'] },
          { label: 'Historial',          icon: 'pi pi-fw pi-history',    routerLink: ['/pagos-sit/historial'] }
        ]
      },
      {
        label: 'Generar XML SAT',
        items: [
          { label: 'Catalogo de cuentas', icon: 'pi pi-fw pi-list',       routerLink: ['/contabilidad-electronica/generar/catalogo'] },
          { label: 'Balanza',             icon: 'pi pi-fw pi-chart-bar',  routerLink: ['/contabilidad-electronica/generar/balanza'] },
          { label: 'Polizas',             icon: 'pi pi-fw pi-file-edit',  routerLink: ['/contabilidad-electronica/generar/polizas'] },
          { label: 'Auxiliar de cuentas', icon: 'pi pi-fw pi-table',      routerLink: ['/contabilidad-electronica/generar/auxiliar'] }
        ]
      }
    ];
  }

}
