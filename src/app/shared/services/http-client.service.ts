import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Wrapper de HttpClient que antepone `environment.apiUrl` a cada path relativo
 * y normaliza el manejo de query params. Las urls absolutas (http(s)://...) se
 * pasan tal cual.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), { params: this.buildParams(params) });
  }

  post<T>(path: string, body: unknown, params?: Record<string, unknown>): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body, { params: this.buildParams(params) });
  }

  put<T>(path: string, body: unknown, params?: Record<string, unknown>): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body, { params: this.buildParams(params) });
  }

  patch<T>(path: string, body: unknown, params?: Record<string, unknown>): Observable<T> {
    return this.http.patch<T>(this.buildUrl(path), body, { params: this.buildParams(params) });
  }

  delete<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), { params: this.buildParams(params) });
  }

  download(path: string, params?: Record<string, unknown>): Observable<Blob> {
    return this.http.get(this.buildUrl(path), {
      params: this.buildParams(params),
      responseType: 'blob'
    });
  }

  /** POST que devuelve un archivo (blob), p. ej. la generacion del .txt SIT. */
  postDownload(path: string, body: unknown, params?: Record<string, unknown>): Observable<Blob> {
    return this.http.post(this.buildUrl(path), body, {
      params: this.buildParams(params),
      responseType: 'blob'
    });
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
    return `${base}${path.replace(/^\//, '')}`;
  }

  private buildParams(params?: Record<string, unknown>): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
