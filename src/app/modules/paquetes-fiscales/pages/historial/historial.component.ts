import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import { ToastService } from '../../../../shared/services/toast.service';
import { PaquetesService } from '../../services/paquetes.service';
import { PaqueteResumen } from '../../models/pfi.models';

@Component({
  selector: 'app-historial-paquetes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, DropdownModule, ButtonModule, TagModule, TooltipModule
  ],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialPaquetesComponent implements OnInit {
  private readonly api = inject(PaquetesService);
  private readonly toast = inject(ToastService);

  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);
  paquetes = signal<PaqueteResumen[]>([]);
  cargando = signal(false);

  readonly anioActual = new Date().getFullYear();
  anios = Array.from({ length: 8 }, (_, i) => this.anioActual - i);
  meses = [
    { label: 'Todos', value: undefined },
    ...Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1).padStart(2, '0'), value: i + 1 }))
  ];
  filtroAnio = signal<number | undefined>(this.anioActual);
  filtroMes = signal<number | undefined>(undefined);

  ngOnInit() {
    this.api.empresas().subscribe({
      next: list => this.empresas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar la lista de empresas.')
    });
  }

  cargar() {
    const emp = this.empresaSeleccionada();
    if (!emp) return;
    this.cargando.set(true);
    this.api.historial(emp.idEmpresa, this.filtroAnio(), this.filtroMes()).subscribe({
      next: list => {
        this.paquetes.set(list ?? []);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el historial.');
        this.cargando.set(false);
      }
    });
  }

  descargar(p: PaqueteResumen) {
    this.api.descargar(p.idPaquete).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = p.nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('No se pudo descargar el archivo.')
    });
  }
}
