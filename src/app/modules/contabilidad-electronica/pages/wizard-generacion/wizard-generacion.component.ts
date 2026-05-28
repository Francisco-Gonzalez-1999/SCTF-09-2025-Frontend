import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import {
  CodigoAgrupadorSat,
  CuentaFaltanteItem,
  GenerarXmlRequest,
  NaturalezaSat,
  ResolverCuentaRequest,
  TipoDocumentoCone,
  TipoEnvioCone,
  TipoSolicitudCone
} from '../../models/cone.models';
import { ConeService } from '../../services/cone.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface EditFaltante {
  codAgrupador?: string;
  idNaturaleza?: number;
  escribirEnSap: boolean;
}

@Component({
  selector: 'app-wizard-generacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    CardModule, DropdownModule, ButtonModule,
    CalendarModule, InputTextModule, TagModule,
    CheckboxModule, TooltipModule, DialogModule, TableModule
  ],
  templateUrl: './wizard-generacion.component.html',
  styleUrl: './wizard-generacion.component.scss'
})
export class WizardGeneracionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cone = inject(ConeService);
  private readonly toast = inject(ToastService);

  tipo = signal<TipoDocumentoCone>('CATALOGO');
  empresas = signal<Empresa[]>([]);
  tiposEnvio = signal<TipoEnvioCone[]>([]);
  tiposSolicitud = signal<TipoSolicitudCone[]>([]);

  empresaSeleccionada = signal<Empresa | null>(null);
  anio = signal<number>(new Date().getFullYear());
  mes = signal<number>(new Date().getMonth() + 1);

  // CATALOGO / BALANZA — nivel de cuentas
  nivelCuenta = signal<number>(1);
  considerarTodasNiveles = signal<boolean>(false);

  // BALANZA
  idTipoEnvio = signal<number | null>(null);
  fechaModBalanza = signal<Date | null>(null);
  anualizada = signal<boolean>(false);
  sinCierre = signal<boolean>(false);

  // POLIZAS / AUXILIAR
  idTipoSolicitud = signal<number | null>(null);
  numTramite = signal<string>('');
  numOrden = signal<string>('');

  generando = signal(false);

  // ============ Dialog "Cuentas faltantes" (reemplazo del MessageBox legacy) ============
  dialogFaltantesVisible = signal(false);
  cuentasFaltantes = signal<CuentaFaltanteItem[]>([]);
  catalogoSat = signal<CodigoAgrupadorSat[]>([]);
  naturalezas = signal<NaturalezaSat[]>([]);
  editsFaltantes = signal<Record<number, EditFaltante>>({});
  resolviendoIds = signal<Set<number>>(new Set());

  readonly anios = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i);
  readonly meses = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: i + 1
  }));
  readonly nivelesCuenta = [1, 2, 3, 4, 5];

  readonly tipoSeleccionadoSolicitud = computed(() =>
    this.tiposSolicitud().find(t => t.idTipoSolicitudCone === this.idTipoSolicitud())
  );
  readonly tipoSeleccionadoEnvio = computed(() =>
    this.tiposEnvio().find(t => t.idTipoEnvio === this.idTipoEnvio())
  );

  readonly mostrarNivel           = computed(() => this.tipo() === 'CATALOGO' || this.tipo() === 'BALANZA');
  readonly mostrarOpcionesBalanza = computed(() => this.tipo() === 'BALANZA');
  readonly requiereTipoSolicitud  = computed(() => this.tipo() === 'POLIZAS' || this.tipo() === 'AUXILIAR');

  ngOnInit() {
    this.route.params.subscribe(p => {
      const t = (p['tipo'] || '').toUpperCase() as TipoDocumentoCone;
      if (['CATALOGO', 'BALANZA', 'POLIZAS', 'AUXILIAR'].includes(t)) this.tipo.set(t);
    });

    this.cone.empresas().subscribe({
      next: list => this.empresas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar la lista de empresas.')
    });
    this.cone.tiposEnvio().subscribe({       next: list => this.tiposEnvio.set(list ?? []) });
    this.cone.tiposSolicitud().subscribe({   next: list => this.tiposSolicitud.set(list ?? []) });
    this.cone.naturalezasSat().subscribe({   next: list => this.naturalezas.set(list ?? []) });
    this.cone.catalogoSat().subscribe({      next: list => this.catalogoSat.set(list ?? []) });
  }

  generar() {
    const emp = this.empresaSeleccionada();
    if (!emp) { this.toast.warn('Selecciona una empresa.'); return; }

    if (this.mostrarOpcionesBalanza() && !this.idTipoEnvio()) {
      this.toast.warn('Selecciona tipo de envio (Normal / Complementaria).');
      return;
    }
    if (this.requiereTipoSolicitud() && !this.idTipoSolicitud()) {
      this.toast.warn('Selecciona tipo de solicitud (DE / CO / AF / FC).');
      return;
    }

    const ts = this.tipoSeleccionadoSolicitud();
    if (ts?.requiereTramite && this.numTramite().length !== (ts.longitudCampo ?? 14)) {
      this.toast.warn(`NumTramite debe tener ${ts.longitudCampo ?? 14} caracteres.`);
      return;
    }
    if (ts?.requiereOrden && this.numOrden().length !== (ts.longitudCampo ?? 13)) {
      this.toast.warn(`NumOrden debe tener ${ts.longitudCampo ?? 13} caracteres.`);
      return;
    }

    const body: GenerarXmlRequest = {
      idEmpresa: emp.idEmpresa,
      anio: this.anio(),
      mes: this.mes(),
      tipoDocumento: this.tipo(),
      idTipoEnvio: this.idTipoEnvio() ?? undefined,
      fechaModBalanza: this.fechaModBalanza()?.toISOString(),
      idTipoSolicitudCone: this.idTipoSolicitud() ?? undefined,
      numTramite: ts?.requiereTramite ? this.numTramite() : undefined,
      numOrden:   ts?.requiereOrden   ? this.numOrden()   : undefined,
      nivelCuenta:           this.mostrarNivel() && !this.considerarTodasNiveles() ? this.nivelCuenta() : undefined,
      considerarTodasNiveles: this.mostrarNivel() ? this.considerarTodasNiveles() : undefined,
      anualizada: this.mostrarOpcionesBalanza() ? this.anualizada() : undefined,
      sinCierre:  this.mostrarOpcionesBalanza() ? this.sinCierre()  : undefined
    };

    this.generando.set(true);
    this.cone.generarXml(body).subscribe({
      next: g => {
        this.toast.success(`XML ${g.tipoDocumento} ${g.anio}-${g.mes} generado: ${g.nombreArchivo} (${this.formatBytes(g.tamanioBytes)})`);
        this.generando.set(false);
      },
      error: err => {
        this.generando.set(false);

        // 422 con CUENTAS_FALTANTES → abrir dialog inline para resolver
        const body = err?.error;
        if (err?.status === 422 && body?.codigo === 'CUENTAS_FALTANTES') {
          this.abrirDialogFaltantes(body.cuentas as CuentaFaltanteItem[], body.mensaje);
          return;
        }

        const detalle = body?.error ?? body?.mensaje ?? err?.message ?? 'Error desconocido';
        this.toast.error(`No se pudo generar el XML: ${detalle}`);
      }
    });
  }

  // ============ Dialog cuentas faltantes ============

  private abrirDialogFaltantes(cuentas: CuentaFaltanteItem[], mensaje: string) {
    this.cuentasFaltantes.set(cuentas);

    // Inicializa el edit por fila (escribir en SAP por default)
    const initial: Record<number, EditFaltante> = {};
    for (const c of cuentas) {
      initial[c.idCuentaSinAgrupador] = {
        codAgrupador: c.codAgrupadorAsignado ?? undefined,
        idNaturaleza: c.idNaturalezaAsignada ?? undefined,
        escribirEnSap: true
      };
    }
    this.editsFaltantes.set(initial);
    this.dialogFaltantesVisible.set(true);
    this.toast.warn(mensaje);
  }

  getEditFaltante(id: number): EditFaltante {
    return this.editsFaltantes()[id] ?? { escribirEnSap: true };
  }

  setEditFaltante(id: number, patch: Partial<EditFaltante>) {
    this.editsFaltantes.update(map => {
      const current = map[id] ?? { escribirEnSap: true };
      return { ...map, [id]: { ...current, ...patch } };
    });
  }

  resolverFaltante(row: CuentaFaltanteItem) {
    const edit = this.getEditFaltante(row.idCuentaSinAgrupador);
    if (!edit.codAgrupador) { this.toast.warn('Selecciona el codigo agrupador.'); return; }
    if (!edit.idNaturaleza) { this.toast.warn('Selecciona la naturaleza (D/A).'); return; }

    const body: ResolverCuentaRequest = {
      idCuentaSinAgrupador: row.idCuentaSinAgrupador,
      codAgrupadorAsignado: edit.codAgrupador,
      idNaturalezaAsignada: edit.idNaturaleza,
      escribirEnSap: edit.escribirEnSap,
      observaciones: undefined
    };

    // Marcar como "resolviendo" para deshabilitar el boton
    this.resolviendoIds.update(s => { const n = new Set(s); n.add(row.idCuentaSinAgrupador); return n; });

    this.cone.resolverCuenta(body).subscribe({
      next: () => {
        this.toast.success(`Cuenta ${row.acctCode} resuelta` + (edit.escribirEnSap ? ' y escrita en SAP.' : '.'));
        // Quitar de la lista visible
        this.cuentasFaltantes.update(list => list.filter(c => c.idCuentaSinAgrupador !== row.idCuentaSinAgrupador));
        this.resolviendoIds.update(s => { const n = new Set(s); n.delete(row.idCuentaSinAgrupador); return n; });

        if (this.cuentasFaltantes().length === 0) {
          this.toast.success('Todas las cuentas fueron resueltas. Ya puedes generar el XML.');
        }
      },
      error: err => {
        this.resolviendoIds.update(s => { const n = new Set(s); n.delete(row.idCuentaSinAgrupador); return n; });
        const msg = err?.error?.error ?? err?.message ?? 'Error desconocido';
        this.toast.error(`No se pudo resolver ${row.acctCode}: ${msg}`);
      }
    });
  }

  reintentarGeneracion() {
    this.dialogFaltantesVisible.set(false);
    this.generar();
  }

  isResolviendo(id: number) {
    return this.resolviendoIds().has(id);
  }

  private formatBytes(bytes?: number | null): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
