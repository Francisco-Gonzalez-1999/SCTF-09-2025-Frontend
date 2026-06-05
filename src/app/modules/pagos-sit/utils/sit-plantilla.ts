import * as XLSX from 'xlsx';
import { SitPagoPdvRow, nuevaFilaPdv } from '../models/sit.models';

/**
 * Plantilla Excel para captura masiva de Pagos en Ventanilla (PDV).
 *
 * COLUMNAS es la unica fuente de verdad: la usan TANTO la exportacion (genera los
 * encabezados) COMO la importacion (mapea cada encabezado a su campo). Asi exportar e
 * importar nunca se desincronizan.
 */
const NOMBRE_HOJA = 'Pagos PDV';
const NOMBRE_ARCHIVO = 'Plantilla_SIT_PDV.xlsx';

type TipoColumna = 'texto' | 'numero' | 'fecha' | 'bool';

interface ColumnaPlantilla {
  header: string;
  campo: keyof SitPagoPdvRow;
  tipo: TipoColumna;
}

const COLUMNAS: ColumnaPlantilla[] = [
  { header: 'Instruccion (A/B)',              campo: 'instruccion',           tipo: 'texto'  },
  { header: 'Tipo documento (FA/FS/OT)',      campo: 'tipoDocumento',         tipo: 'texto'  },
  { header: 'Concepto',                       campo: 'concepto',              tipo: 'texto'  },
  { header: 'Referencia',                     campo: 'referenciaSit',         tipo: 'texto'  },
  { header: 'Importe',                        campo: 'importe',               tipo: 'numero' },
  { header: 'Divisa',                         campo: 'divisa',                tipo: 'texto'  },
  { header: 'Nombre beneficiario 1',          campo: 'nombreBeneficiario1',   tipo: 'texto'  },
  { header: 'Clave identificacion 1',         campo: 'claveIdentificacion1',  tipo: 'texto'  },
  { header: 'Numero identificacion 1',        campo: 'numeroIdentificacion1', tipo: 'texto'  },
  { header: 'Nombre beneficiario 2',          campo: 'nombreBeneficiario2',   tipo: 'texto'  },
  { header: 'Clave identificacion 2',         campo: 'claveIdentificacion2',  tipo: 'texto'  },
  { header: 'Numero identificacion 2',        campo: 'numeroIdentificacion2', tipo: 'texto'  },
  { header: 'Tipo confirmacion (00/01/03)',   campo: 'tipoConfirmacion',      tipo: 'texto'  },
  { header: 'Correo o celular',               campo: 'correoOCelular',        tipo: 'texto'  },
  { header: 'Fecha pago (AAAA-MM-DD)',        campo: 'fechaPago',             tipo: 'fecha'  },
  { header: 'Fecha vigencia (AAAA-MM-DD)',    campo: 'fechaVigencia',         tipo: 'fecha'  },
  { header: 'Fecha documento (AAAA-MM-DD)',   campo: 'fechaDocumento',        tipo: 'fecha'  },
  { header: 'Mancomunado (SI/NO)',            campo: 'mancomunado',           tipo: 'bool'   },
  { header: 'Cheque de caja (SI/NO)',         campo: 'chequeDeCaja',          tipo: 'bool'   },
  { header: 'Rafaga personalizada (SI/NO)',   campo: 'rafagaPersonalizada',   tipo: 'bool'   },
  { header: 'Mensaje rafaga',                 campo: 'mensajeRafaga',         tipo: 'texto'  }
];

/**
 * Descarga la plantilla Excel. Si recibe filas con datos, las exporta; si no, incluye
 * una fila de ejemplo. Agrega una hoja "Instrucciones" con los valores permitidos.
 */
export function exportarPlantilla(filas: SitPagoPdvRow[]): void {
  const origen = filas.length ? filas : [filaEjemplo()];

  const datos = origen.map(f => {
    const fila: Record<string, unknown> = {};
    for (const c of COLUMNAS) fila[c.header] = formatearExport(f[c.campo], c.tipo);
    return fila;
  });

  const hojaPagos = XLSX.utils.json_to_sheet(datos, { header: COLUMNAS.map(c => c.header) });
  hojaPagos['!cols'] = COLUMNAS.map(c => ({ wch: Math.max(c.header.length + 2, 16) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaPagos, NOMBRE_HOJA);
  XLSX.utils.book_append_sheet(wb, hojaInstrucciones(), 'Instrucciones');
  XLSX.writeFile(wb, NOMBRE_ARCHIVO);
}

/**
 * Lee un archivo .xlsx con la estructura de la plantilla y devuelve las filas listas
 * para la tabla. Ignora filas totalmente vacias. Lanza error si el archivo no es legible.
 */
export async function importarPlantilla(file: File): Promise<SitPagoPdvRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const nombreHoja = wb.SheetNames.includes(NOMBRE_HOJA) ? NOMBRE_HOJA : wb.SheetNames[0];
  const hoja = wb.Sheets[nombreHoja];
  if (!hoja) return [];

  const registros = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });

  const filas: SitPagoPdvRow[] = [];
  for (const reg of registros) {
    if (esRegistroVacio(reg)) continue;
    const fila = nuevaFilaPdv();
    for (const c of COLUMNAS) {
      if (!(c.header in reg)) continue;
      asignarCampo(fila, c, reg[c.header]);
    }
    filas.push(fila);
  }
  return filas;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function filaEjemplo(): SitPagoPdvRow {
  // Datos ficticios/genericos a proposito: es solo una fila guia de formato.
  return {
    ...nuevaFilaPdv(),
    concepto: 'CONCEPTO DE EJEMPLO',
    referenciaSit: 'REFERENCIA001',
    importe: 1000,
    nombreBeneficiario1: 'NOMBRE DEL BENEFICIARIO',
    claveIdentificacion1: '2',
    numeroIdentificacion1: '0000000000',
    tipoConfirmacion: '01',
    correoOCelular: 'correo@ejemplo.com'
  };
}

function hojaInstrucciones(): XLSX.WorkSheet {
  const aoa: string[][] = [
    ['Columna', 'Valores permitidos / formato'],
    ['Instruccion', 'A = Alta, B = Baja'],
    ['Tipo documento', 'FA = Factura, FS = Factura Servicio, OT = Otros'],
    ['Importe', 'Numero con decimales, ej. 1000.00 (sin signo de pesos)'],
    ['Divisa', 'MXP, USD, EUR, CAD, CHF, GBP, SEK, JPY'],
    ['Clave identificacion 1/2', '2 = Credencial de elector (INE/IFE). Otros codigos: por confirmar.'],
    ['Tipo confirmacion', '00 = Sin confirmacion, 01 = E-mail, 03 = SMS'],
    ['Fechas', 'Formato AAAA-MM-DD, ej. 2026-06-03'],
    ['Mancomunado / Cheque de caja / Rafaga', 'SI o NO'],
    ['', ''],
    ['IMPORTANTE', 'No cambies los encabezados de la hoja "Pagos PDV".'],
    ['', 'Borra la fila de ejemplo y captura tus pagos (una fila por pago).']
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 36 }, { wch: 70 }];
  return ws;
}

function formatearExport(valor: unknown, tipo: TipoColumna): unknown {
  switch (tipo) {
    case 'bool': return valor ? 'SI' : 'NO';
    case 'fecha': return valor instanceof Date ? aIso(valor) : '';
    case 'numero': return valor ?? '';
    default: return valor ?? '';
  }
}

function asignarCampo(fila: SitPagoPdvRow, col: ColumnaPlantilla, valor: unknown): void {
  switch (col.tipo) {
    case 'texto':
      (fila[col.campo] as string) = valor == null ? '' : String(valor).trim();
      break;
    case 'numero':
      (fila[col.campo] as number | null) = aNumero(valor);
      break;
    case 'fecha':
      (fila[col.campo] as Date | null) = aFecha(valor);
      break;
    case 'bool':
      (fila[col.campo] as boolean) = aBool(valor);
      break;
  }
}

function esRegistroVacio(reg: Record<string, unknown>): boolean {
  return Object.values(reg).every(v => v == null || String(v).trim() === '');
}

function aNumero(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number') return valor;
  const n = Number(String(valor).replace(/[, $]/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function aFecha(valor: unknown): Date | null {
  if (valor instanceof Date) return valor;
  if (valor == null || valor === '') return null;
  const txt = String(valor).trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(txt);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(txt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function aBool(valor: unknown): boolean {
  if (typeof valor === 'boolean') return valor;
  const t = String(valor ?? '').trim().toUpperCase();
  return t === 'SI' || t === 'SÍ' || t === 'S' || t === 'TRUE' || t === '1' || t === 'X';
}

function aIso(fecha: Date): string {
  const a = fecha.getFullYear().toString().padStart(4, '0');
  const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const d = fecha.getDate().toString().padStart(2, '0');
  return `${a}-${m}-${d}`;
}
