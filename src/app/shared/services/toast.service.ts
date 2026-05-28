import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiErrorInfo, extractApiError, formatApiErrorForToast } from './api-error.helper';

/**
 * Wrapper de PrimeNG MessageService con helpers comunes para no repetir
 * { severity, summary, detail } en cada llamada.
 *
 * El helper `apiError(err)` extrae automaticamente la info de un
 * HttpErrorResponse del backend (con o sin nuestro middleware) y muestra un
 * mensaje legible. Devuelve la info estructurada para que el caller pueda
 * actuar sobre el codigo (ej. CUENTAS_FALTANTES → abrir dialog).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageService = inject(MessageService);

  success(detail: string, summary = 'Exito') {
    this.messageService.add({ severity: 'success', summary, detail, life: 4000 });
  }

  info(detail: string, summary = 'Informacion') {
    this.messageService.add({ severity: 'info', summary, detail, life: 4000 });
  }

  warn(detail: string, summary = 'Atencion') {
    this.messageService.add({ severity: 'warn', summary, detail, life: 5000 });
  }

  error(detail: string, summary = 'Error') {
    this.messageService.add({ severity: 'error', summary, detail, life: 8000 });
  }

  /**
   * Muestra un toast de error con info completa extraida de un error HTTP.
   * Devuelve la info estructurada (status, codigo, mensaje, traceId, ...)
   * por si el caller necesita reaccionar a algun codigo en particular.
   *
   * Tambien escribe el error en consola con `console.error` y `console.group`
   * para que puedas inspeccionar el objeto completo en DevTools (incluye stack,
   * inner exception, headers, etc. — todo lo que no cabe en el toast).
   */
  apiError(err: unknown, prefijo?: string): ApiErrorInfo {
    const info = extractApiError(err);
    const { summary, detail } = formatApiErrorForToast(info);
    const mensaje = prefijo ? `${prefijo}\n${detail}` : detail;

    // ============ Log enriquecido en consola del navegador ============
    // Usamos console.group para que se pueda colapsar; console.error
    // garantiza el color rojo y stack trace en DevTools.
    /* eslint-disable no-console */
    console.group(`%c[API ERROR] ${summary} - ${info.codigo}`, 'color:#dc2626;font-weight:bold');
    console.error('Mensaje :', info.mensaje);
    if (info.detalle)       console.error('Detalle :', info.detalle);
    if (info.innerMensaje)  console.error('Causa   :', info.innerMensaje);
    if (info.traceId)       console.error('TraceId :', info.traceId);
    console.error('Status  :', info.status);
    console.error('Codigo  :', info.codigo);
    console.error('Raw body:', info.raw);
    console.error('Error completo (HttpErrorResponse):', err);
    console.groupEnd();
    /* eslint-enable no-console */

    this.messageService.add({
      severity: 'error',
      summary,
      detail: mensaje,
      life: 10000,
      sticky: info.status >= 500   // errores serios se quedan hasta que el usuario los cierre
    });
    return info;
  }

  clear() {
    this.messageService.clear();
  }
}
