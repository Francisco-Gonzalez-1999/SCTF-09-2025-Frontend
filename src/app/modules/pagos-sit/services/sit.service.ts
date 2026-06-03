import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../shared/services/http-client.service';
import {
  SitLoteDetalle,
  SitLoteInvalidoResponse,
  SitLoteRequest,
  SitLoteResumen,
  SitPagoPdvDto,
  SitPagoPdvRow
} from '../models/sit.models';

/**
 * Cliente HTTP del modulo SIT. La generacion es un POST que devuelve el archivo .txt
 * (blob). Si el lote no pasa validacion, el backend responde 422 con JSON; como la
 * peticion pide blob, ese JSON llega como Blob y se parsea con `parseErrorValidacion`.
 */
@Injectable({ providedIn: 'root' })
export class SitService {
  private readonly api = inject(ApiClient);

  /** Genera el archivo SIT (.txt), lo guarda en la bitacora y lo devuelve como blob. */
  generar(lote: SitLoteRequest): Observable<Blob> {
    return this.api.postDownload('Sit/Pagos/Generar', lote);
  }

  /** Historial de lotes generados (sin el contenido del archivo). */
  historial(filtros?: { idEmpresa?: number; desde?: string; hasta?: string }): Observable<SitLoteResumen[]> {
    return this.api.get<SitLoteResumen[]>('Sit/Pagos', filtros as Record<string, unknown>);
  }

  /** Detalle de un lote (cabecera + pagos). */
  detalle(idLote: number): Observable<SitLoteDetalle> {
    return this.api.get<SitLoteDetalle>(`Sit/Pagos/${idLote}`);
  }

  /** Re-descarga el .txt guardado de un lote. */
  descargarGuardado(idLote: number): Observable<Blob> {
    return this.api.download(`Sit/Pagos/${idLote}/Descargar`);
  }

  /** Baja logica de un lote (soft-delete). */
  eliminar(idLote: number): Observable<void> {
    return this.api.delete<void>(`Sit/Pagos/${idLote}`);
  }

  /**
   * Intenta extraer la respuesta de validacion (422) de un HttpErrorResponse cuyo
   * cuerpo es un Blob (porque la peticion pidio responseType blob). Devuelve null
   * si no es un error de validacion reconocible.
   */
  async parseErrorValidacion(err: unknown): Promise<SitLoteInvalidoResponse | null> {
    if (!(err instanceof HttpErrorResponse) || err.status !== 422) return null;
    try {
      const texto = err.error instanceof Blob ? await err.error.text() : JSON.stringify(err.error);
      const json = JSON.parse(texto);
      return json?.codigo === 'SIT_INVALIDO' ? (json as SitLoteInvalidoResponse) : null;
    } catch {
      return null;
    }
  }
}

/** Convierte una fila de la tabla (UI) al DTO de envio. */
export function filaADto(r: SitPagoPdvRow): SitPagoPdvDto {
  return {
    instruccion: r.instruccion,
    tipoDocumento: r.tipoDocumento,
    concepto: r.concepto,
    referenciaSit: r.referenciaSit,
    importe: r.importe ?? 0,
    divisa: r.divisa,
    nombreBeneficiario1: r.nombreBeneficiario1,
    claveIdentificacion1: r.claveIdentificacion1,
    numeroIdentificacion1: vacioANull(r.numeroIdentificacion1),
    nombreBeneficiario2: vacioANull(r.nombreBeneficiario2),
    claveIdentificacion2: vacioANull(r.claveIdentificacion2),
    numeroIdentificacion2: vacioANull(r.numeroIdentificacion2),
    tipoConfirmacion: r.tipoConfirmacion,
    correoOCelular: vacioANull(r.correoOCelular),
    fechaPago: aFechaIso(r.fechaPago),
    fechaVigencia: aFechaIso(r.fechaVigencia),
    fechaDocumento: aFechaIso(r.fechaDocumento),
    rafagaPersonalizada: r.rafagaPersonalizada,
    chequeDeCaja: r.chequeDeCaja,
    mancomunado: r.mancomunado,
    mensajeRafaga: vacioANull(r.mensajeRafaga)
  };
}

/** Formatea una fecha local como 'AAAA-MM-DD' (sin desfase de zona horaria). */
export function aFechaIso(fecha: Date | null): string {
  if (!fecha) return '0001-01-01';
  const a = fecha.getFullYear().toString().padStart(4, '0');
  const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const d = fecha.getDate().toString().padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function vacioANull(s: string | null | undefined): string | null {
  const v = (s ?? '').trim();
  return v === '' ? null : v;
}
