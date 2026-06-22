import * as XLSX from 'xlsx';
import { FilaPaquete } from '../models/pfi.models';

/**
 * Plantilla Excel del modulo PFI (ultima version del legacy). Columnas por POSICION
 * (igual que el legacy, que lee por indice de celda, no por encabezado):
 *
 *   A = Transid (numero de asiento)   <- llave
 *   B = Indice bancario
 *   C = Ref1 (se ignora)
 *   D = UUID
 *   E = Fecha (dd/MM/yyyy)            -> de aqui se sacan Año/Mes
 *   F = Año     (respaldo si E no parsea)
 *   G = Mes     (respaldo si E no parsea)
 */
const NOMBRE_HOJA = 'Paquete';
const NOMBRE_ARCHIVO = 'Plantilla_Paquetes_Fiscales.xlsx';
const ENCABEZADOS = ['Transid', 'Indice', 'Ref1', 'UUID', 'Fecha', 'Año', 'Mes'];

export interface FilaExcelPaquete {
  transid: string;
  indice: string;
  uuid: string;
  anio: number | null;
  mes: number | null;
}

/** Descarga una plantilla con encabezados y una fila de ejemplo. */
export function exportarPlantillaPaquetes(): void {
  const hoy = new Date();
  const ejemplo = ['841516', '841516', '', '00000000-0000-0000-0000-000000000000',
    '01/01/2023', hoy.getFullYear(), hoy.getMonth() + 1];

  const hoja = XLSX.utils.aoa_to_sheet([ENCABEZADOS, ejemplo]);
  hoja['!cols'] = ENCABEZADOS.map(h => ({ wch: Math.max(h.length + 2, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hoja, NOMBRE_HOJA);
  XLSX.writeFile(wb, NOMBRE_ARCHIVO);
}

/** Lee el .xlsx por posicion de columna. Ignora la primera fila (encabezados) y las vacias. */
export async function importarPlantillaPaquetes(file: File): Promise<FilaExcelPaquete[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const nombreHoja = wb.SheetNames.includes(NOMBRE_HOJA) ? NOMBRE_HOJA : wb.SheetNames[0];
  const hoja = wb.Sheets[nombreHoja];
  if (!hoja) return [];

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, defval: '' });

  const filas: FilaExcelPaquete[] = [];
  for (let i = 1; i < matriz.length; i++) {  // i=1: saltamos encabezados
    const r = matriz[i] ?? [];
    const transid = aTexto(r[0]);
    if (!transid) continue;  // sin Transid no hay renglon

    const { anio, mes } = resolverPeriodo(r[4], r[5], r[6]);
    filas.push({
      transid,
      indice: aTexto(r[1]),
      uuid: aTexto(r[3]),
      anio,
      mes
    });
  }
  return filas;
}

/** Convierte filas del Excel a las filas editables de la tabla. */
export function filasExcelAFilasPaquete(filas: FilaExcelPaquete[]): FilaPaquete[] {
  return filas.map(f => ({ transid: f.transid, indice: f.indice, uuid: f.uuid }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Saca Año/Mes de la fecha (col E); si no parsea, usa las columnas Año (F) y Mes (G). */
function resolverPeriodo(fecha: unknown, anioCol: unknown, mesCol: unknown): { anio: number | null; mes: number | null } {
  if (fecha instanceof Date && !isNaN(fecha.getTime()))
    return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 };

  const txt = aTexto(fecha);
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(txt);  // dd/MM/yyyy
  if (m) return { anio: Number(m[3]), mes: Number(m[1]) };

  return { anio: aNumero(anioCol), mes: aNumero(mesCol) };
}

function aTexto(valor: unknown): string {
  if (valor == null || valor === '') return '';
  if (typeof valor === 'number' && Number.isFinite(valor))
    return Number.isInteger(valor) ? String(Math.trunc(valor)) : String(valor);
  return String(valor).trim();
}

function aNumero(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  const n = Number(String(valor).replace(/[, $]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}
