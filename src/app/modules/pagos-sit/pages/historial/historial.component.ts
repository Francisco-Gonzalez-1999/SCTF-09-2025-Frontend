import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ToastService } from '../../../../shared/services/toast.service';
import { SitService, aFechaIso } from '../../services/sit.service';
import { SitLoteDetalle, SitLoteResumen } from '../../models/sit.models';

/**
 * Historial / auditoria de archivos SIT generados. Lista los lotes guardados, permite
 * re-descargar el .txt exacto que se entrego, ver el detalle de pagos y dar de baja
 * logica (soft-delete) un lote.
 */
@Component({
  selector: 'app-sit-historial',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, TagModule, TooltipModule, CalendarModule, DialogModule
  ],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class SitHistorialComponent implements OnInit {
  private readonly sit = inject(SitService);
  private readonly toast = inject(ToastService);

  lotes = signal<SitLoteResumen[]>([]);
  cargando = signal(false);

  desde: Date | null = null;
  hasta: Date | null = null;

  // Detalle (dialog)
  detalleVisible = signal(false);
  detalle = signal<SitLoteDetalle | null>(null);
  cargandoDetalle = signal(false);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    const filtros: { desde?: string; hasta?: string } = {};
    if (this.desde) filtros.desde = aFechaIso(this.desde);
    if (this.hasta) filtros.hasta = aFechaIso(this.hasta);

    this.sit.historial(filtros).subscribe({
      next: list => {
        this.lotes.set(list ?? []);
        this.cargando.set(false);
      },
      error: err => {
        this.cargando.set(false);
        this.toast.apiError(err, 'No se pudo cargar el historial.');
      }
    });
  }

  limpiarFiltros() {
    this.desde = null;
    this.hasta = null;
    this.cargar();
  }

  descargar(lote: SitLoteResumen) {
    this.sit.descargarGuardado(lote.idLoteSit).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = lote.nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);
        // Refleja el cambio de estado (GENERADO -> DESCARGADO) que hace el backend.
        if (lote.estado === 'GENERADO') {
          this.lotes.update(list =>
            list.map(l => (l.idLoteSit === lote.idLoteSit ? { ...l, estado: 'DESCARGADO' } : l)));
        }
      },
      error: err => this.toast.apiError(err, 'No se pudo descargar el archivo.')
    });
  }

  verDetalle(lote: SitLoteResumen) {
    this.detalleVisible.set(true);
    this.detalle.set(null);
    this.cargandoDetalle.set(true);
    this.sit.detalle(lote.idLoteSit).subscribe({
      next: d => {
        this.detalle.set(d);
        this.cargandoDetalle.set(false);
      },
      error: err => {
        this.cargandoDetalle.set(false);
        this.detalleVisible.set(false);
        this.toast.apiError(err, 'No se pudo cargar el detalle.');
      }
    });
  }

  eliminar(lote: SitLoteResumen) {
    if (!confirm(`Dar de baja el lote "${lote.claveArchivo}" del ${lote.fechaEnvio}? (no se borra fisicamente)`)) return;
    this.sit.eliminar(lote.idLoteSit).subscribe({
      next: () => {
        this.lotes.update(list => list.filter(l => l.idLoteSit !== lote.idLoteSit));
        this.toast.success('Lote dado de baja.');
      },
      error: err => this.toast.apiError(err, 'No se pudo dar de baja el lote.')
    });
  }

  severityEstado(estado: string): 'success' | 'info' | 'warning' {
    switch (estado) {
      case 'DESCARGADO':
      case 'ENVIADO': return 'success';
      case 'GENERADO': return 'info';
      default: return 'warning';
    }
  }
}
