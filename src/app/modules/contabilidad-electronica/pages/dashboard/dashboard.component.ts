import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import { ConeService } from '../../services/cone.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string[];
  color: string;
}

@Component({
  selector: 'app-cone-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardModule, DropdownModule, ButtonModule, TagModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class ConeDashboardComponent implements OnInit {
  private readonly coneService = inject(ConeService);
  private readonly toast = inject(ToastService);

  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);
  cargando = signal(false);

  readonly accesos: AccesoRapido[] = [
    {
      titulo: 'Catalogo de cuentas',
      descripcion: 'Genera el XML del catalogo con codigo agrupador SAT.',
      icono: 'pi pi-list',
      ruta: ['/contabilidad-electronica', 'generar', 'catalogo'],
      color: 'bg-blue-100 text-blue-700'
    },
    {
      titulo: 'Balanza de comprobacion',
      descripcion: 'Balanza Normal o Complementaria por periodo.',
      icono: 'pi pi-chart-bar',
      ruta: ['/contabilidad-electronica', 'generar', 'balanza'],
      color: 'bg-green-100 text-green-700'
    },
    {
      titulo: 'Polizas del periodo',
      descripcion: 'XML de polizas con tipo de solicitud DE / CO / AF / FC.',
      icono: 'pi pi-file-edit',
      ruta: ['/contabilidad-electronica', 'generar', 'polizas'],
      color: 'bg-purple-100 text-purple-700'
    },
    {
      titulo: 'Auxiliar de cuentas',
      descripcion: 'Detalle por cuenta y movimiento del periodo.',
      icono: 'pi pi-table',
      ruta: ['/contabilidad-electronica', 'generar', 'auxiliar'],
      color: 'bg-orange-100 text-orange-700'
    },
    {
      titulo: 'Cuentas sin agrupador',
      descripcion: 'Cuentas que aun no tienen U_COD_AG; editalas aqui.',
      icono: 'pi pi-exclamation-triangle',
      ruta: ['/contabilidad-electronica', 'cuentas-sin-agrupador'],
      color: 'bg-red-100 text-red-700'
    },
    {
      titulo: 'Configuracion',
      descripcion: 'Parametros del modulo por empresa.',
      icono: 'pi pi-cog',
      ruta: ['/contabilidad-electronica', 'configuracion'],
      color: 'bg-gray-100 text-gray-700'
    }
  ];

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.cargando.set(true);
    this.coneService.empresas().subscribe({
      next: list => {
        this.empresas.set(list ?? []);
        this.cargando.set(false);
      },
      error: err => {
        console.error(err);
        this.toast.error('No se pudo cargar la lista de empresas.');
        this.cargando.set(false);
      }
    });
  }
}
