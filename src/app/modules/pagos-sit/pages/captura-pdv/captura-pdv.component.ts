import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ToastService } from '../../../../shared/services/toast.service';
import { SitService, filaADto } from '../../services/sit.service';
import { exportarPlantilla, importarPlantilla } from '../../utils/sit-plantilla';
import {
  OPCIONES_DIVISA,
  OPCIONES_IDENTIFICACION,
  OPCIONES_INSTRUCCION,
  OPCIONES_TIPO_CONFIRMACION,
  OPCIONES_TIPO_DOCUMENTO,
  Opcion,
  SitLoteRequest,
  SitPagoPdvRow,
  nuevaFilaPdv
} from '../../models/sit.models';

/**
 * Captura de Pagos en Ventanilla (PDV) y exportacion del archivo SIT (.txt) de BBVA.
 * Replica la grilla del software de BBVA: una cabecera de lote + una tabla editable de
 * pagos. El backend (libreria SCTF.Sit, cubierta por pruebas byte a byte) genera el .txt.
 */
@Component({
  selector: 'app-captura-pdv',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, DropdownModule, CalendarModule,
    InputNumberModule, InputTextModule, CheckboxModule, TooltipModule
  ],
  templateUrl: './captura-pdv.component.html',
  styleUrl: './captura-pdv.component.scss'
})
export class CapturaPdvComponent {
  private readonly sit = inject(SitService);
  private readonly toast = inject(ToastService);

  // ---- Catalogos para los dropdowns ----
  readonly instrucciones = OPCIONES_INSTRUCCION;
  readonly tiposDocumento = OPCIONES_TIPO_DOCUMENTO;
  readonly divisas = OPCIONES_DIVISA;
  readonly tiposConfirmacion = OPCIONES_TIPO_CONFIRMACION;
  readonly identificaciones = OPCIONES_IDENTIFICACION;

  // ---- Cabecera del lote (campos planos para [(ngModel)]) ----
  convenio = '';
  claveArchivo = '';
  fechaEnvio: Date | null = new Date();

  // ---- Pagos ----
  pagos = signal<SitPagoPdvRow[]>([nuevaFilaPdv()]);
  generando = signal(false);

  /** Errores de validacion del ultimo intento, por indice de fila (-1 = cabecera). */
  errores = signal<Map<number, string[]>>(new Map());

  /**
   * Resumen por divisa (estilo "Resumen de documentos" de BBVA). Es un metodo (no un
   * computed) para que refleje las ediciones in-place de las celdas de la tabla en cada
   * ciclo de deteccion de cambios.
   */
  resumen() {
    const porDivisa = new Map<string, { altas: number; importeAltas: number; bajas: number; importeBajas: number }>();
    for (const p of this.pagos()) {
      const d = p.divisa || 'MXP';
      const acc = porDivisa.get(d) ?? { altas: 0, importeAltas: 0, bajas: 0, importeBajas: 0 };
      const imp = p.importe ?? 0;
      if (p.instruccion === 'B') { acc.bajas++; acc.importeBajas += imp; }
      else { acc.altas++; acc.importeAltas += imp; }
      porDivisa.set(d, acc);
    }
    return Array.from(porDivisa.entries()).map(([divisa, v]) => ({ divisa, ...v }));
  }

  agregar() {
    this.pagos.update(list => [...list, nuevaFilaPdv()]);
  }

  /** Descarga la plantilla Excel (con los datos actuales si los hay, o un ejemplo). */
  descargarPlantilla() {
    const conDatos = this.pagos().filter(p =>
      p.concepto || p.referenciaSit || p.nombreBeneficiario1 || (p.importe ?? 0) > 0);
    exportarPlantilla(conDatos);
  }

  /** Lee el .xlsx seleccionado y reemplaza el contenido de la tabla con sus filas. */
  async importarExcel(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const filas = await importarPlantilla(file);
      if (!filas.length) {
        this.toast.warn('El archivo no contiene pagos para importar.');
        return;
      }
      this.pagos.set(filas);
      this.errores.set(new Map());
      this.toast.success(`Se importaron ${filas.length} pago(s). Revisalos y luego exporta el SIT.`);
    } catch {
      this.toast.error('No se pudo leer el archivo. Verifica que sea la plantilla .xlsx correcta.');
    } finally {
      input.value = ''; // permite volver a seleccionar el mismo archivo
    }
  }

  duplicar(i: number) {
    this.pagos.update(list => {
      const copia = { ...list[i] };
      return [...list.slice(0, i + 1), copia, ...list.slice(i + 1)];
    });
  }

  eliminar(i: number) {
    this.pagos.update(list => list.filter((_, idx) => idx !== i));
    this.errores.set(new Map());
  }

  erroresDeFila(i: number): string[] {
    return this.errores().get(i) ?? [];
  }

  erroresCabecera(): string[] {
    return this.errores().get(-1) ?? [];
  }

  generar() {
    if (this.generando()) return;

    const lote: SitLoteRequest = {
      header: {
        convenio: this.convenio.trim(),
        fechaEnvio: this.fechaIso(this.fechaEnvio),
        tipoValidacion: '01',
        claveArchivo: this.claveArchivo.trim()
      },
      pagos: this.pagos().map(filaADto)
    };

    this.generando.set(true);
    this.errores.set(new Map());

    this.sit.generar(lote).subscribe({
      next: blob => {
        this.descargar(blob, lote);
        this.generando.set(false);
        this.toast.success(`Archivo SIT generado con ${lote.pagos.length} pago(s).`);
      },
      error: async err => {
        this.generando.set(false);
        const invalido = await this.sit.parseErrorValidacion(err);
        if (invalido) {
          this.mapearErrores(invalido.errores);
          this.toast.warn(`El lote tiene ${invalido.errores.length} error(es) de validacion. Revisa los campos marcados.`);
        } else {
          this.toast.apiError(err, 'No se pudo generar el archivo SIT.');
        }
      }
    });
  }

  private descargar(blob: Blob, lote: SitLoteRequest) {
    const clave = (lote.header.claveArchivo || 'SIT').replace(/[^A-Za-z0-9]/g, '');
    const fecha = lote.header.fechaEnvio.replace(/-/g, '');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIT_${clave || 'SIT'}_${fecha}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private mapearErrores(errores: { indice: number | null; mensaje: string }[]) {
    const mapa = new Map<number, string[]>();
    for (const e of errores) {
      const k = e.indice ?? -1;
      mapa.set(k, [...(mapa.get(k) ?? []), e.mensaje]);
    }
    this.errores.set(mapa);
  }

  private fechaIso(fecha: Date | null): string {
    if (!fecha) return '';
    const a = fecha.getFullYear().toString().padStart(4, '0');
    const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const d = fecha.getDate().toString().padStart(2, '0');
    return `${a}-${m}-${d}`;
  }

  etiqueta(opciones: Opcion[], value: string): string {
    return opciones.find(o => o.value === value)?.label ?? value;
  }
}
