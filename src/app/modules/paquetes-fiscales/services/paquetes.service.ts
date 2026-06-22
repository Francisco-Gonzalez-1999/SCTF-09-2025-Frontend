import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../shared/services/http-client.service';
import { Empresa } from '../../../shared/interfaces/empresa.interface';
import { GenerarPaqueteRequest, PaqueteResumen } from '../models/pfi.models';

/**
 * Cliente HTTP del modulo PFI (Paquetes Fiscales). Rutas relativas a
 * environment.apiUrl, prefijadas con "Pfi/". El catalogo de empresas se reutiliza
 * del modulo CONE ("Cone/Empresas") por ser el mismo endpoint.
 */
@Injectable({ providedIn: 'root' })
export class PaquetesService {
  private readonly api = inject(ApiClient);

  empresas(): Observable<Empresa[]> {
    return this.api.get<Empresa[]>('Cone/Empresas');
  }

  generar(body: GenerarPaqueteRequest): Observable<PaqueteResumen> {
    return this.api.post<PaqueteResumen>('Pfi/Paquetes', body);
  }

  historial(idEmpresa: number, anio?: number, mes?: number): Observable<PaqueteResumen[]> {
    return this.api.get<PaqueteResumen[]>('Pfi/Paquetes', { idEmpresa, anio, mes });
  }

  descargar(idPaquete: number): Observable<Blob> {
    return this.api.download(`Pfi/Paquetes/${idPaquete}/Descargar`);
  }
}
