/**
 * Modelos del modulo SIT (generacion de archivos de pagos de BBVA).
 * Alineados con la libreria SCTF_09_2025_Backend.Sit (DTOs SitLoteRequest / SitPagoPdv).
 *
 * Las fechas viajan al backend como 'AAAA-MM-DD' (DateOnly de .NET). En la UI se manejan
 * como Date (p-calendar) y se serializan al enviar.
 */

// ===== DTOs de envio (wire) =====

export interface SitLoteHeaderDto {
  idEmpresa?: number | null;
  convenio: string;
  fechaEnvio: string;       // AAAA-MM-DD
  tipoValidacion: string;   // PDV/BNC: '01'
  claveArchivo: string;
}

export interface SitPagoPdvDto {
  instruccion: string;          // 'A' | 'B'
  tipoDocumento: string;        // 'FA' | 'FS' | 'OT'
  concepto: string;
  referenciaSit: string;
  importe: number;
  divisa: string;               // 'MXP' | 'USD' | ...

  nombreBeneficiario1: string;
  claveIdentificacion1: string; // codigo de catalogo, ej '2'
  numeroIdentificacion1?: string | null;

  nombreBeneficiario2?: string | null;
  claveIdentificacion2?: string | null;
  numeroIdentificacion2?: string | null;

  tipoConfirmacion: string;     // '00' | '01' | '03'
  correoOCelular?: string | null;

  fechaPago: string;            // AAAA-MM-DD
  fechaVigencia: string;        // AAAA-MM-DD
  fechaDocumento: string;       // AAAA-MM-DD

  rafagaPersonalizada: boolean;
  chequeDeCaja: boolean;
  mancomunado: boolean;
  mensajeRafaga?: string | null;
}

export interface SitLoteRequest {
  header: SitLoteHeaderDto;
  pagos: SitPagoPdvDto[];
}

/** Respuesta 422 del backend cuando el lote no pasa validacion. */
export interface SitErrorValidacion {
  indice: number | null;   // indice del pago (0-based) o null si es de cabecera
  campo: string;
  mensaje: string;
}

export interface SitLoteInvalidoResponse {
  codigo: 'SIT_INVALIDO';
  mensaje: string;
  errores: SitErrorValidacion[];
}

// ===== Historial / auditoria =====

export interface SitLoteResumen {
  idLoteSit: number;
  idEmpresa: number | null;
  convenio: string;
  claveArchivo: string;
  fechaEnvio: string;
  tipoServicio: string;
  numPagos: number;
  numAltas: number;
  numBajas: number;
  importeTotalAltas: number;
  importeTotalBajas: number;
  divisaPrincipal: string | null;
  nombreArchivo: string;
  tamanioBytes: number | null;
  hashSha256: string | null;
  estado: string;          // GENERADO | DESCARGADO | ENVIADO
  fechaCreacion: string;
}

export interface SitPagoPdvDetalle {
  consecutivo: number;
  instruccion: string;
  claveTipoDocumento: string;
  concepto: string;
  referenciaSit: string;
  importe: number;
  divisa: string;
  nombreBeneficiario1: string;
  claveIdentificacion1: string;
  numeroIdentificacion1: string | null;
  nombreBeneficiario2: string | null;
  claveIdentificacion2: string | null;
  numeroIdentificacion2: string | null;
  claveTipoConfirmacion: string;
  correoOCelular: string | null;
  fechaPago: string;
  fechaVigencia: string;
  fechaDocumento: string;
  rafagaPersonalizada: boolean;
  chequeDeCaja: boolean;
  mancomunado: boolean;
  mensajeRafaga: string | null;
}

export interface SitLoteDetalle {
  lote: SitLoteResumen;
  pagos: SitPagoPdvDetalle[];
}

// ===== Modelo de fila para la tabla editable (UI) =====

export interface SitPagoPdvRow {
  instruccion: string;
  tipoDocumento: string;
  concepto: string;
  referenciaSit: string;
  importe: number | null;
  divisa: string;

  nombreBeneficiario1: string;
  claveIdentificacion1: string;
  numeroIdentificacion1: string;

  nombreBeneficiario2: string;
  claveIdentificacion2: string;
  numeroIdentificacion2: string;

  tipoConfirmacion: string;
  correoOCelular: string;

  fechaPago: Date | null;
  fechaVigencia: Date | null;
  fechaDocumento: Date | null;

  rafagaPersonalizada: boolean;
  chequeDeCaja: boolean;
  mancomunado: boolean;
  mensajeRafaga: string;
}

export function nuevaFilaPdv(): SitPagoPdvRow {
  const hoy = new Date();
  return {
    instruccion: 'A',
    tipoDocumento: 'OT',
    concepto: '',
    referenciaSit: '',
    importe: null,
    divisa: 'MXP',
    nombreBeneficiario1: '',
    claveIdentificacion1: '2',
    numeroIdentificacion1: '',
    nombreBeneficiario2: '',
    claveIdentificacion2: '',
    numeroIdentificacion2: '',
    tipoConfirmacion: '00',
    correoOCelular: '',
    fechaPago: hoy,
    fechaVigencia: hoy,
    fechaDocumento: hoy,
    rafagaPersonalizada: false,
    chequeDeCaja: false,
    mancomunado: false,
    mensajeRafaga: ''
  };
}

// ===== Catalogos para los dropdowns =====

export interface Opcion {
  label: string;
  value: string;
}

export const OPCIONES_INSTRUCCION: Opcion[] = [
  { label: 'Alta', value: 'A' },
  { label: 'Baja', value: 'B' }
];

export const OPCIONES_TIPO_DOCUMENTO: Opcion[] = [
  { label: 'Factura', value: 'FA' },
  { label: 'Factura Servicio', value: 'FS' },
  { label: 'Otros', value: 'OT' }
];

export const OPCIONES_DIVISA: Opcion[] = [
  { label: 'MXP (Pesos)', value: 'MXP' },
  { label: 'USD (Dolares)', value: 'USD' },
  { label: 'EUR (Euros)', value: 'EUR' },
  { label: 'CAD (Dolar canadiense)', value: 'CAD' },
  { label: 'CHF (Franco suizo)', value: 'CHF' },
  { label: 'GBP (Libra esterlina)', value: 'GBP' },
  { label: 'SEK (Corona sueca)', value: 'SEK' },
  { label: 'JPY (Yen japones)', value: 'JPY' }
];

export const OPCIONES_TIPO_CONFIRMACION: Opcion[] = [
  { label: 'Sin confirmacion', value: '00' },
  { label: 'E-mail', value: '01' },
  { label: 'SMS', value: '03' }
];

/**
 * Tipos de identificacion del beneficiario (campo 20 del Detalle).
 *
 * CONFIRMADO contra el archivo real JAVI PRUEBA2.txt: "Credencial de elector" -> codigo '2'.
 * Las etiquetas (INE, PASAPORTE, FM 2, FM 3, LICENCIA) provienen del generador oficial
 * SIM_X, pero el mapeo etiqueta->codigo del resto vive en el VBA compilado y AUN NO esta
 * confirmado. No inventamos codigos: se agregaran aqui conforme se verifiquen generando
 * muestras con la herramienta de BBVA.
 */
export const OPCIONES_IDENTIFICACION: Opcion[] = [
  { label: 'Credencial de elector (INE/IFE)', value: '2' }
  // TODO(catalogo SIT): confirmar codigos de PASAPORTE, FM 2, FM 3, LICENCIA con SIM_X.
];
