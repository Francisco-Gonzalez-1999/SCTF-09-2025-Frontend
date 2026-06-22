/**
 * Modelos del modulo PFI (Paquetes Fiscales), alineados con los DTOs en
 * SCTF_09_2025_Backend.Controllers.Pfi.Dtos.
 *
 * Version web de la ULTIMA version del legacy: por cada renglon (Transid, Indice,
 * UUID) y cada tipo de documento marcado, el backend dispara el servicio PHP+Crystal
 * y arma un .zip con XML, PDF de factura, poliza, ordenes y pagos.
 */

/** Un renglon a empaquetar (del Excel). */
export interface PaqueteItemRequest {
  transid: string;
  indice?: string | null;
  uuid?: string | null;
}

/** Tipos de documento a incluir (los 7 checkboxes del legacy). */
export interface OpcionesDocumentos {
  obtenerXml: boolean;
  obtenerPdf: boolean;
  obtenerPoliza: boolean;
  obtenerOrdenCompra: boolean;
  obtenerOrdenVenta: boolean;
  obtenerPagoEfectuado: boolean;
  obtenerPagoRecibido: boolean;
}

export interface GenerarPaqueteRequest extends OpcionesDocumentos {
  idEmpresa: number;
  anio: number;
  mes: number;
  rutasArchivos?: string[];   // carpetas de CFDI (una por tipo: Ingreso, Egreso, ...)
  items: PaqueteItemRequest[];
}

export interface PaqueteAdvertencia {
  transid: string;
  detalle: string;
}

/** Resumen de un paquete generado (sin el binario; el .zip se baja en /Descargar). */
export interface PaqueteResumen {
  idPaquete: number;
  idEmpresa: number;
  anio: number;
  mes: number;
  totalFacturas: number;
  polizasGeneradas: number;
  xmlIncluidos: number;
  nombreArchivo: string;
  tamanioBytes?: number | null;
  hashSha256?: string | null;
  estaActivo: boolean;
  fechaCreacion: string;
  advertencias: PaqueteAdvertencia[];
}

/** Fila editable de la tabla (importada del Excel). */
export interface FilaPaquete {
  transid: string;
  indice: string;
  uuid: string;
}
