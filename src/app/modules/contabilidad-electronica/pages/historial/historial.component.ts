import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import { EstadoValidacion, Generacion, TipoDocumentoCone } from '../../models/cone.models';
import { ConeService } from '../../services/cone.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-historial-generaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, DropdownModule, ButtonModule, TagModule,
    TooltipModule, CalendarModule, InputNumberModule
  ],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialGeneracionesComponent implements OnInit {
  private readonly cone = inject(ConeService);
  private readonly toast = inject(ToastService);

  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);
  generaciones = signal<Generacion[]>([]);
  cargando = signal(false);

  readonly anioActual = new Date().getFullYear();
  anios = Array.from({ length: 8 }, (_, i) => this.anioActual - i);
  meses = [
    { label: 'Todos', value: undefined },
    ...Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1).padStart(2, '0'), value: i + 1 }))
  ];
  filtroAnio = signal<number | undefined>(this.anioActual);
  filtroMes = signal<number | undefined>(undefined);

  /** Opciones para el filtro de columna "Tipo". Mismo formato que el catalogo SAT. */
  readonly opcionesTipoDocumento = [
    { label: 'Catalogo', value: 'CATALOGO' },
    { label: 'Balanza',  value: 'BALANZA'  },
    { label: 'Polizas',  value: 'POLIZAS'  },
    { label: 'Auxiliar', value: 'AUXILIAR' }
  ];

  /** Opciones para el filtro de columna "Estado validacion". */
  readonly opcionesEstadoValidacion = [
    { label: 'Generado',     value: 'GENERADO'    },
    { label: 'Validado',     value: 'VALIDADO'    },
    { label: 'Con errores',  value: 'CON_ERRORES' },
    { label: 'Descargado',   value: 'DESCARGADO'  }
  ];

  ngOnInit() {
    this.cone.empresas().subscribe({
      next: list => this.empresas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar la lista de empresas.')
    });
  }

  cargar() {
    const emp = this.empresaSeleccionada();
    if (!emp) return;
    this.cargando.set(true);
    this.cone.historial(emp.idEmpresa, this.filtroAnio(), this.filtroMes()).subscribe({
      next: list => {
        this.generaciones.set(list ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el historial.');
        this.cargando.set(false);
      }
    });
  }

  descargar(g: Generacion) {
    this.cone.descargarXml(g.idGeneracion).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = g.nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('No se pudo descargar el archivo.')
    });
  }

  severityValidacion(estado: EstadoValidacion): 'success' | 'warning' | 'danger' | 'info' {
    switch (estado) {
      case 'VALIDADO':     return 'success';
      case 'GENERADO':     return 'info';
      case 'CON_ERRORES':  return 'danger';
      case 'DESCARGADO':   return 'success';
      default:             return 'warning';
    }
  }

  iconoTipo(tipo: TipoDocumentoCone): string {
    switch (tipo) {
      case 'CATALOGO': return 'pi pi-list';
      case 'BALANZA':  return 'pi pi-chart-bar';
      case 'POLIZAS':  return 'pi pi-file-edit';
      case 'AUXILIAR': return 'pi pi-table';
    }
  }
}
