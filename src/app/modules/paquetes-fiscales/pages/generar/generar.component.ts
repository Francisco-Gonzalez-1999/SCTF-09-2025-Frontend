import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { Empresa } from '../../../../shared/interfaces/empresa.interface';
import { ToastService } from '../../../../shared/services/toast.service';
import { PaquetesService } from '../../services/paquetes.service';
import { FilaPaquete, GenerarPaqueteRequest, OpcionesDocumentos, PaqueteResumen } from '../../models/pfi.models';
import {
  exportarPlantillaPaquetes,
  filasExcelAFilasPaquete,
  importarPlantillaPaquetes
} from '../../utils/pfi-plantilla';

@Component({
  selector: 'app-generar-paquete',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, DropdownModule, ButtonModule, TooltipModule, InputTextModule, CheckboxModule
  ],
  templateUrl: './generar.component.html',
  styleUrl: './generar.component.scss'
})
export class GenerarPaqueteComponent implements OnInit {
  private readonly api = inject(PaquetesService);
  private readonly toast = inject(ToastService);

  empresas = signal<Empresa[]>([]);
  empresaSeleccionada = signal<Empresa | null>(null);

  // Periodo del paquete: SOLO LECTURA, lo define el Excel al importar.
  readonly anioActual = new Date().getFullYear();
  anio = signal<number | null>(null);
  mes = signal<number | null>(null);

  /** Carpetas de los CFDI, una por linea (una por tipo: Ingreso, Egreso, ...).
   *  Vacio = usa la ruta base configurada en el backend. */
  rutasTexto = signal<string>('');

  /** Los 7 checkboxes del legacy (todos marcados por defecto). */
  opciones: OpcionesDocumentos = {
    obtenerXml: true,
    obtenerPdf: true,
    obtenerPoliza: true,
    obtenerOrdenCompra: true,
    obtenerOrdenVenta: true,
    obtenerPagoEfectuado: true,
    obtenerPagoRecibido: true
  };

  filas = signal<FilaPaquete[]>([]);
  seleccionados: FilaPaquete[] = [];

  generando = signal(false);
  ultimoResultado = signal<PaqueteResumen | null>(null);

  readonly tieneFilas = computed(() => this.filas().length > 0);

  // ---- Documentos: maestro "seleccionar todos" ----
  get todosMarcados(): boolean {
    return Object.values(this.opciones).every(Boolean);
  }
  get hayAlgunDocumento(): boolean {
    return Object.values(this.opciones).some(Boolean);
  }
  setTodos(valor: boolean) {
    (Object.keys(this.opciones) as (keyof OpcionesDocumentos)[]).forEach(k => this.opciones[k] = valor);
  }

  // ---- Validacion / guia ----
  get puedeGenerar(): boolean {
    return !!this.empresaSeleccionada() && this.tieneFilas()
        && this.seleccionados.length > 0 && this.hayAlgunDocumento;
  }
  /** Mensaje de que falta para poder generar (para el tooltip del boton). */
  get motivoFalta(): string {
    if (!this.empresaSeleccionada()) return 'Selecciona una empresa.';
    if (!this.tieneFilas()) return 'Importa la plantilla de Excel.';
    if (!this.seleccionados.length) return 'Selecciona al menos un renglon en la tabla.';
    if (!this.hayAlgunDocumento) return 'Marca al menos un documento a incluir.';
    return '';
  }
  /** Periodo (del Excel) en texto, o "—" si aun no se importa. */
  get periodoTexto(): string {
    const a = this.anio(), m = this.mes();
    return a && m ? `${String(m).padStart(2, '0')}/${a}` : '—';
  }

  ngOnInit() {
    this.api.empresas().subscribe({
      next: list => this.empresas.set(list ?? []),
      error: () => this.toast.error('No se pudo cargar la lista de empresas.')
    });
  }

  descargarPlantilla() {
    exportarPlantillaPaquetes();
  }

  /** Importa la plantilla Excel (Transid, Indice, UUID, Fecha) y arma las filas. */
  async importarExcel(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const filasExcel = await importarPlantillaPaquetes(file);
      if (!filasExcel.length) {
        this.toast.warn('El archivo no contiene renglones con Transid.');
        return;
      }
      // Si el Excel trae fecha, usamos su periodo para el paquete.
      const primera = filasExcel[0];
      if (primera.anio) this.anio.set(primera.anio);
      if (primera.mes) this.mes.set(primera.mes);

      const filas = filasExcelAFilasPaquete(filasExcel);
      this.filas.set(filas);
      this.seleccionados = [...filas];
      this.ultimoResultado.set(null);
      this.toast.success(`Se importaron ${filas.length} renglon(es) del Excel.`);
    } catch {
      this.toast.error('No se pudo leer el archivo Excel.');
    } finally {
      input.value = ''; // permite reseleccionar el mismo archivo
    }
  }

  generar() {
    const emp = this.empresaSeleccionada();
    if (!emp) { this.toast.warn('Selecciona una empresa.'); return; }
    if (!this.seleccionados.length) { this.toast.warn('Selecciona al menos un renglon.'); return; }

    const rutasArchivos = this.rutasTexto()
      .split(/\r?\n/)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const body: GenerarPaqueteRequest = {
      idEmpresa: emp.idEmpresa,
      anio: this.anio() ?? this.anioActual,
      mes: this.mes() ?? (new Date().getMonth() + 1),
      rutasArchivos,
      ...this.opciones,
      items: this.seleccionados.map(f => ({
        transid: f.transid,
        indice: f.indice || null,
        uuid: f.uuid || null
      }))
    };

    this.generando.set(true);
    this.api.generar(body).subscribe({
      next: resumen => {
        this.ultimoResultado.set(resumen);
        this.generando.set(false);
        const avisos = resumen.advertencias.length;
        this.toast.success(
          `Paquete generado de ${resumen.totalFacturas} renglon(es).` +
          (avisos ? ` ${avisos} advertencia(s).` : ''));
        this.descargar(resumen); // descarga automatica del .zip
      },
      error: err => {
        this.toast.apiError(err, 'No se pudo generar el paquete.');
        this.generando.set(false);
      }
    });
  }

  descargar(resumen: PaqueteResumen) {
    this.api.descargar(resumen.idPaquete).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = resumen.nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('No se pudo descargar el ZIP.')
    });
  }

  limpiar() {
    this.filas.set([]);
    this.seleccionados = [];
    this.ultimoResultado.set(null);
    this.anio.set(null);
    this.mes.set(null);
  }
}
