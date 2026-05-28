import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import {
  CodigoAgrupadorSat,
  CuentaSinAgrupador,
  EstadoCuentaSinAgrupador,
  NaturalezaSat,
  ResolverCuentaRequest
} from '../../models/cone.models';
import { ConeService } from '../../services/cone.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface EditState {
  codAgrupador?: string;
  idNaturaleza?: number;
  escribirEnSap: boolean;
  observaciones?: string;
}

@Component({
  selector: 'app-cuentas-sin-agrupador',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DropdownModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    CheckboxModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './cuentas-sin-agrupador.component.html',
  styleUrl: './cuentas-sin-agrupador.component.scss'
})
export class CuentasSinAgrupadorComponent implements OnInit {
  private readonly cone = inject(ConeService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);
  cuentas = signal<CuentaSinAgrupador[]>([]);
  catalogoSat = signal<CodigoAgrupadorSat[]>([]);
  naturalezas = signal<NaturalezaSat[]>([]);
  estadoFiltro = signal<EstadoCuentaSinAgrupador>('PENDIENTE');
  cargando = signal(false);
  detectando = signal(false);

  /** Estado de edicion por fila. Key = idCuentaSinAgrupador. */
  edits = signal<Record<number, EditState>>({});

  readonly opcionesEstado: { label: string; value: EstadoCuentaSinAgrupador }[] = [
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Resueltas',  value: 'RESUELTO'  },
    { label: 'Ignoradas',  value: 'IGNORADO'  }
  ];

  totalPendientes = computed(() =>
    this.cuentas().filter(c => c.estado === 'PENDIENTE').length
  );

  ngOnInit() {
    this.cargarReferenciales();
  }

  private cargarReferenciales() {
    this.cone.empresas().subscribe({
      next: list => this.empresas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar la lista de empresas.')
    });
    this.cone.catalogoSat().subscribe({
      next: list => this.catalogoSat.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar el catalogo SAT.')
    });
    this.cone.naturalezasSat().subscribe({
      next: list => this.naturalezas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar las naturalezas SAT.')
    });
  }

  onEmpresaSeleccionada() {
    const emp = this.empresaSeleccionada();
    if (!emp) {
      this.cuentas.set([]);
      return;
    }
    this.cargar();
  }

  cargar() {
    const emp = this.empresaSeleccionada();
    if (!emp) return;
    this.cargando.set(true);
    this.cone.cuentasSinAgrupador(emp.idEmpresa, this.estadoFiltro()).subscribe({
      next: list => {
        const cuentas = list ?? [];
        this.cuentas.set(cuentas);

        // Inicializamos los edits AQUI (event handler, no template).
        // Asi getEdit() puede ser puramente de lectura y nunca dispara NG0600.
        const initialEdits: Record<number, EditState> = {};
        for (const c of cuentas) {
          initialEdits[c.idCuentaSinAgrupador] = { escribirEnSap: true };
        }
        this.edits.set(initialEdits);

        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar las cuentas pendientes.');
        this.cargando.set(false);
      }
    });
  }

  detectar() {
    const emp = this.empresaSeleccionada();
    if (!emp) {
      this.toast.warn('Selecciona una empresa primero.');
      return;
    }
    this.detectando.set(true);
    this.cone.detectarCuentasSinAgrupador(emp.idEmpresa).subscribe({
      next: list => {
        const nuevas = list?.length ?? 0;
        this.toast.success(`Se detectaron ${nuevas} cuentas sin codigo agrupador.`);
        this.cargar();
        this.detectando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo ejecutar la deteccion contra SAP.');
        this.detectando.set(false);
      }
    });
  }

  /**
   * SOLO LECTURA. Se llama desde el template (binding [ngModel]),
   * por eso NO debe modificar signals — Angular lo prohibe con NG0600.
   * Si por alguna razon no hay edit (cuenta que aparecio despues de cargar),
   * devolvemos un default sin guardarlo; el primer setEdit lo materializa.
   */
  getEdit(id: number): EditState {
    return this.edits()[id] ?? { escribirEnSap: true };
  }

  /**
   * Se llama desde event handlers (onChange/ngModelChange), donde
   * escribir signals SI esta permitido. Crea el entry si no existia.
   */
  setEdit(id: number, patch: Partial<EditState>) {
    this.edits.update(map => {
      const current = map[id] ?? { escribirEnSap: true };
      return { ...map, [id]: { ...current, ...patch } };
    });
  }

  resolver(row: CuentaSinAgrupador) {
    const edit = this.getEdit(row.idCuentaSinAgrupador);
    if (!edit.codAgrupador) {
      this.toast.warn('Selecciona un codigo agrupador antes de guardar.');
      return;
    }
    if (!edit.idNaturaleza) {
      this.toast.warn('Selecciona la naturaleza (D/A).');
      return;
    }

    const body: ResolverCuentaRequest = {
      idCuentaSinAgrupador: row.idCuentaSinAgrupador,
      codAgrupadorAsignado: edit.codAgrupador,
      idNaturalezaAsignada: edit.idNaturaleza,
      escribirEnSap: edit.escribirEnSap,
      observaciones: edit.observaciones
    };

    this.cone.resolverCuenta(body).subscribe({
      next: actualizada => {
        const detalle = actualizada.escritoEnSap
          ? `Cuenta ${row.acctCode} actualizada en SAP y registrada.`
          : `Cuenta ${row.acctCode} marcada como resuelta (sin escribir en SAP).`;
        this.toast.success(detalle);
        this.cargar();
      },
      error: () => this.toast.error(`No se pudo resolver la cuenta ${row.acctCode}.`)
    });
  }

  ignorar(row: CuentaSinAgrupador) {
    this.confirm.confirm({
      header: 'Ignorar cuenta',
      message: `La cuenta ${row.acctCode} se marcara como ignorada y dejara de aparecer en las generaciones. Continuar?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.cone.ignorarCuenta(row.idCuentaSinAgrupador).subscribe({
          next: () => {
            this.toast.success(`Cuenta ${row.acctCode} ignorada.`);
            this.cargar();
          },
          error: () => this.toast.error('No se pudo ignorar la cuenta.')
        });
      }
    });
  }

  estadoSeverity(estado: EstadoCuentaSinAgrupador): 'warning' | 'success' | 'secondary' {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'RESUELTO':  return 'success';
      default:          return 'secondary';
    }
  }
}
