import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import { ConfiguracionCone } from '../../models/cone.models';
import { ConeService } from '../../services/cone.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-configuracion-cone',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, DropdownModule, ButtonModule,
    InputTextModule, CheckboxModule, DividerModule
  ],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionConeComponent implements OnInit {
  private readonly cone = inject(ConeService);
  private readonly toast = inject(ToastService);

  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);
  cfg = signal<ConfiguracionCone | null>(null);
  cargando = signal(false);
  guardando = signal(false);

  ngOnInit() {
    this.cone.empresas().subscribe({
      next: list => this.empresas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar la lista de empresas.')
    });
  }

  onEmpresaSeleccionada() {
    const emp = this.empresaSeleccionada();
    if (!emp) {
      this.cfg.set(null);
      return;
    }
    this.cargando.set(true);
    this.cone.configuracion(emp.idEmpresa).subscribe({
      next: c => {
        this.cfg.set(c ?? this.configuracionPorDefecto(emp.idEmpresa));
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la configuracion.');
        this.cfg.set(this.configuracionPorDefecto(emp.idEmpresa));
        this.cargando.set(false);
      }
    });
  }

  guardar() {
    const c = this.cfg();
    if (!c) return;
    this.guardando.set(true);
    this.cone.guardarConfiguracion(c).subscribe({
      next: actualizada => {
        this.cfg.set(actualizada);
        this.toast.success('Configuracion guardada.');
        this.guardando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo guardar la configuracion.');
        this.guardando.set(false);
      }
    });
  }

  patch<K extends keyof ConfiguracionCone>(field: K, value: ConfiguracionCone[K]) {
    const current = this.cfg();
    if (!current) return;
    this.cfg.set({ ...current, [field]: value });
  }

  private configuracionPorDefecto(idEmpresa: number): ConfiguracionCone {
    return {
      idConfiguracion: 0,
      idEmpresa,
      campoCodigoAgrupador: 'U_COD_AG',
      campoNaturaleza: 'U_Naturaleza',
      usarJerarquiaNiveles: true,
      incluirCuentasOrden: false,
      incluirAdjuntos: false,
      incluirFacturasNativas: false,
      usarFolioConsecutivo: false,
      generarPdf: false
    };
  }
}
