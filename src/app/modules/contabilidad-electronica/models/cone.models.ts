/**
 * Modelos del modulo CONE (Contabilidad Electronica) alineados con
 * las entidades EF en SCTF_09_2025_Backend.Models.SCTF_09_2025_BD.Cone*.
 */

export type TipoDocumentoCone = 'CATALOGO' | 'BALANZA' | 'POLIZAS' | 'AUXILIAR';
export type EstadoCuentaSinAgrupador = 'PENDIENTE' | 'RESUELTO' | 'IGNORADO';
export type EstadoValidacion = 'GENERADO' | 'VALIDADO' | 'CON_ERRORES' | 'DESCARGADO';

export interface NaturalezaSat {
  idNaturalezaSat: number;
  clave: 'D' | 'A';
  nombre: string;
}

export interface TipoSolicitudCone {
  idTipoSolicitudCone: number;
  clave: 'AF' | 'FC' | 'DE' | 'CO';
  nombre: string;
  descripcion?: string | null;
  requiereTramite: boolean;
  requiereOrden: boolean;
  longitudCampo?: number | null;
  orden: number;
}

export interface TipoEnvioCone {
  idTipoEnvio: number;
  clave: 'N' | 'C';
  nombre: string;
  descripcion?: string | null;
  requiereFechaMod: boolean;
  orden: number;
}

export interface CodigoAgrupadorSat {
  idCodigoAgrupadorSat: number;
  codAgrupador: string;
  nomCuenta: string;
  nivel: number;
  idNaturalezaSat: number;
  codAgrupadorPadre?: string | null;
}

export interface CuentaSinAgrupador {
  idCuentaSinAgrupador: number;
  idEmpresa: number;
  idGeneracion?: number | null;
  acctCode: string;
  acctName?: string | null;
  nivelCuenta?: number | null;
  fatherNum?: string | null;
  estado: EstadoCuentaSinAgrupador;
  codAgrupadorAsignado?: string | null;
  idNaturalezaAsignada?: number | null;
  escritoEnSap: boolean;
  fechaEscrituraSap?: string | null;
  observaciones?: string | null;
  fechaCreacion: string;
  fechaResolucion?: string | null;
  usuarioResolucion?: number | null;
}

export interface Generacion {
  idGeneracion: number;
  idEmpresa: number;
  tipoDocumento: TipoDocumentoCone;
  anio: number;
  mes: number;
  idTipoEnvio?: number | null;
  fechaModBalanza?: string | null;
  idTipoSolicitudCone?: number | null;
  numTramite?: string | null;
  numOrden?: string | null;
  estadoValidacion: EstadoValidacion;
  detalleValidacion?: string | null;
  nombreArchivo: string;
  tamanioBytes?: number | null;
  hashSha256?: string | null;
  fechaCreacion: string;
  usuarioCreacion?: number | null;
}

export interface ConfiguracionCone {
  idConfiguracion: number;
  idEmpresa: number;
  campoCodigoAgrupador: string;
  campoNaturaleza: string;
  usarJerarquiaNiveles: boolean;
  incluirCuentasOrden: boolean;
  incluirAdjuntos: boolean;
  incluirFacturasNativas: boolean;
  usarFolioConsecutivo: boolean;
  generarPdf: boolean;
  rfcChequeDefault?: string | null;
  rfcTransferenciaDefault?: string | null;
  rfcOtrosMpDefault?: string | null;
  polizaConceptoCampo?: string | null;
  transferenciaConceptoCampo?: string | null;
  trfBancoDestinoDefault?: string | null;
  trfCuentaDestinoDefault?: string | null;
  otroMetodoPagoDefault?: string | null;
  compFolioAuxCampo?: string | null;
  compExtTaxIdCampo?: string | null;
  rutaCompAsientoXml?: string | null;
  rutaCompAsientoLineaXml?: string | null;
  rutaCompDocLineasXml?: string | null;
}

/** Request para resolver una cuenta sin agrupador (asigna U_COD_AG y opcional escribe a SAP). */
export interface ResolverCuentaRequest {
  idCuentaSinAgrupador: number;
  codAgrupadorAsignado: string;
  idNaturalezaAsignada: number;
  escribirEnSap: boolean;
  observaciones?: string;
}

/**
 * Respuesta 422 (Unprocessable Entity) que envia el backend cuando se intenta
 * generar un XML pero hay cuentas SAP sin codigo agrupador / naturaleza.
 * Se reconoce por `codigo === 'CUENTAS_FALTANTES'`.
 */
export interface CuentasFaltantesResponse {
  codigo: 'CUENTAS_FALTANTES';
  mensaje: string;
  totalFaltantes: number;
  cuentas: CuentaFaltanteItem[];
}

export interface CuentaFaltanteItem {
  idCuentaSinAgrupador: number;
  acctCode: string;
  acctName?: string | null;
  nivelCuenta?: number | null;
  fatherNum?: string | null;
  codAgrupadorAsignado?: string | null;
  idNaturalezaAsignada?: number | null;
}

/** Request para generar un XML del SAT. */
export interface GenerarXmlRequest {
  idEmpresa: number;
  anio: number;
  mes: number;
  tipoDocumento: TipoDocumentoCone;

  // BALANZA
  idTipoEnvio?: number;
  fechaModBalanza?: string;

  // POLIZAS / AUXILIAR
  idTipoSolicitudCone?: number;
  numTramite?: string;
  numOrden?: string;

  // CATALOGO / BALANZA  (nivel de cuentas a incluir)
  nivelCuenta?: number;
  considerarTodasNiveles?: boolean;

  // BALANZA
  anualizada?: boolean;
  sinCierre?: boolean;
}
