import { HttpErrorResponse } from '@angular/common/http';

/**
 * Forma del JSON estandar que devuelve el backend ApiExceptionMiddleware:
 *   { traceId, codigo, mensaje, detalle, innerError, stack }
 * Tambien sirve para respuestas de negocio como CUENTAS_FALTANTES (que
 * tienen `codigo` propio).
 */
export interface ApiErrorBody {
  traceId?: string;
  codigo?: string;
  mensaje?: string;
  detalle?: string | null;
  innerError?: { tipo?: string; mensaje?: string } | null;
  stack?: string | null;
  // legacy / formatos viejos
  error?: string;
  title?: string;
}

export interface ApiErrorInfo {
  status: number;
  codigo: string;          // p.ej. 'SQL_TIMEOUT', 'OPERACION_INVALIDA', 'NETWORK', 'UNKNOWN'
  mensaje: string;         // legible para el usuario
  detalle?: string;        // mensaje tecnico (development)
  traceId?: string;
  innerMensaje?: string;
  raw: ApiErrorBody | null;
}

/**
 * Extrae info util de un HttpErrorResponse de Angular sin importar el
 * formato exacto del backend. Da prioridad al JSON estandar del
 * ApiExceptionMiddleware pero degrada bien con respuestas legacy.
 */
export function extractApiError(err: unknown): ApiErrorInfo {
  // Caso 1: NO es HttpErrorResponse — algo realmente inesperado del cliente
  if (!(err instanceof HttpErrorResponse)) {
    return {
      status: 0,
      codigo: 'CLIENT_ERROR',
      mensaje: (err as { message?: string })?.message ?? 'Error desconocido del cliente.',
      raw: null
    };
  }

  // Caso 2: status 0 = no se pudo conectar (CORS, server down, red)
  if (err.status === 0) {
    return {
      status: 0,
      codigo: 'NETWORK',
      mensaje: 'No se pudo conectar al servidor. Revisa que el backend este corriendo y que el CORS este configurado.',
      detalle: err.message,
      raw: null
    };
  }

  const body = err.error as ApiErrorBody | string | null | undefined;

  // Caso 3: el body es JSON (lo normal con nuestro middleware)
  if (body && typeof body === 'object') {
    return {
      status: err.status,
      codigo:   body.codigo  ?? `HTTP_${err.status}`,
      mensaje:  body.mensaje ?? body.error ?? body.title ?? defaultMessageFor(err.status),
      detalle:  body.detalle ?? undefined,
      traceId:  body.traceId,
      innerMensaje: body.innerError?.mensaje,
      raw: body
    };
  }

  // Caso 4: el body es texto plano
  if (typeof body === 'string' && body.length > 0) {
    return {
      status: err.status,
      codigo: `HTTP_${err.status}`,
      mensaje: body,
      raw: null
    };
  }

  // Caso 5: ni body ni nada — mensaje generico por status
  return {
    status: err.status,
    codigo: `HTTP_${err.status}`,
    mensaje: defaultMessageFor(err.status),
    detalle: err.message,
    raw: null
  };
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400: return 'Datos invalidos en la peticion.';
    case 401: return 'No estas autenticado. Vuelve a iniciar sesion.';
    case 403: return 'No tienes permisos para esta operacion.';
    case 404: return 'El recurso solicitado no existe.';
    case 408: return 'La peticion tardo demasiado.';
    case 409: return 'Conflicto: el recurso ya fue modificado por otra sesion.';
    case 422: return 'No se puede procesar: hay datos pendientes de resolver.';
    case 429: return 'Demasiadas peticiones, espera un momento.';
    case 500: return 'Error interno del servidor.';
    case 502: return 'Bad Gateway: problema entre el backend y un servicio externo (BD, SAP, etc).';
    case 503: return 'Servicio temporalmente no disponible.';
    case 504: return 'Timeout: la operacion tardo demasiado en responder.';
    default:  return `Error HTTP ${status}.`;
  }
}

/**
 * Helper para mostrar un mensaje completo y util en un toast.
 * Devuelve algo como: "Error interno del servidor (SQL_TIMEOUT). TraceId: 0HMV6ABC..."
 */
export function formatApiErrorForToast(info: ApiErrorInfo): { summary: string; detail: string } {
  const summary = info.codigo === 'NETWORK'
    ? 'Sin conexion'
    : `Error ${info.status > 0 ? info.status : ''}`.trim();

  let detail = info.mensaje;
  if (info.innerMensaje && info.innerMensaje !== info.mensaje) {
    detail += `\nCausa: ${info.innerMensaje}`;
  }
  if (info.traceId) {
    detail += `\nTraceId: ${info.traceId}`;
  }
  return { summary, detail };
}
