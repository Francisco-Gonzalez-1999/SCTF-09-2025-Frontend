import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Wrapper de PrimeNG MessageService con helpers comunes para no repetir
 * { severity, summary, detail } en cada llamada.
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
    this.messageService.add({ severity: 'error', summary, detail, life: 6000 });
  }

  clear() {
    this.messageService.clear();
  }
}
