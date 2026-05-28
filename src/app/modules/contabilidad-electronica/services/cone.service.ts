import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../shared/services/http-client.service';
import { Empresa } from '../../../shared/interfaces/empresa.interface';
import {
  CodigoAgrupadorSat,
  ConfiguracionCone,
  CuentaSinAgrupador,
  Generacion,
  GenerarXmlRequest,
  NaturalezaSat,
  ResolverCuentaRequest,
  TipoEnvioCone,
  TipoSolicitudCone
} from '../models/cone.models';

/**
 * Cliente HTTP del modulo CONE. Todas las rutas son relativas a environment.apiUrl
 * y se prefijan con "Cone/" (controllers en SCTF_09_2025_BD/Cone/).
 */
@Injectable({ providedIn: 'root' })
export class ConeService {
  private readonly api = inject(ApiClient);

  // ---------- Catalogos ----------
  empresas(): Observable<Empresa[]> {
    return this.api.get<Empresa[]>('Cone/Empresas');
  }

  tiposSolicitud(): Observable<TipoSolicitudCone[]> {
    return this.api.get<TipoSolicitudCone[]>('Cone/Catalogos/TiposSolicitud');
  }

  tiposEnvio(): Observable<TipoEnvioCone[]> {
    return this.api.get<TipoEnvioCone[]>('Cone/Catalogos/TiposEnvio');
  }

  naturalezasSat(): Observable<NaturalezaSat[]> {
    return this.api.get<NaturalezaSat[]>('Cone/Catalogos/Naturalezas');
  }

  catalogoSat(filtro?: string): Observable<CodigoAgrupadorSat[]> {
    return this.api.get<CodigoAgrupadorSat[]>('Cone/Catalogos/CatalogoSAT', { filtro });
  }

  // ---------- Cuentas sin agrupador (UI interactiva) ----------
  cuentasSinAgrupador(idEmpresa: number, estado?: string): Observable<CuentaSinAgrupador[]> {
    return this.api.get<CuentaSinAgrupador[]>('Cone/CuentasSinAgrupador', { idEmpresa, estado });
  }

  detectarCuentasSinAgrupador(idEmpresa: number): Observable<CuentaSinAgrupador[]> {
    return this.api.post<CuentaSinAgrupador[]>('Cone/CuentasSinAgrupador/Detectar', { idEmpresa });
  }

  resolverCuenta(body: ResolverCuentaRequest): Observable<CuentaSinAgrupador> {
    return this.api.post<CuentaSinAgrupador>('Cone/CuentasSinAgrupador/Resolver', body);
  }

  ignorarCuenta(idCuentaSinAgrupador: number, motivo?: string): Observable<CuentaSinAgrupador> {
    return this.api.post<CuentaSinAgrupador>('Cone/CuentasSinAgrupador/Ignorar', {
      idCuentaSinAgrupador,
      motivo
    });
  }

  // ---------- Configuracion por empresa ----------
  configuracion(idEmpresa: number): Observable<ConfiguracionCone | null> {
    return this.api.get<ConfiguracionCone | null>(`Cone/Configuraciones/${idEmpresa}`);
  }

  guardarConfiguracion(body: ConfiguracionCone): Observable<ConfiguracionCone> {
    return this.api.put<ConfiguracionCone>(`Cone/Configuraciones/${body.idEmpresa}`, body);
  }

  // ---------- Generaciones ----------
  historial(idEmpresa: number, anio?: number, mes?: number): Observable<Generacion[]> {
    return this.api.get<Generacion[]>('Cone/Generaciones', { idEmpresa, anio, mes });
  }

  generarXml(body: GenerarXmlRequest): Observable<Generacion> {
    return this.api.post<Generacion>('Cone/Generaciones', body);
  }

  descargarXml(idGeneracion: number): Observable<Blob> {
    return this.api.download(`Cone/Generaciones/${idGeneracion}/Descargar`);
  }
}
