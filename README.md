# SCTF-09-2025-Frontend

Frontend del **Sistema de Control de Tesorería y Fiscal** (Tododren). Angular 18 + PrimeNG 17 + MSAL Azure AD.

Incluye actualmente los siguientes módulos:

- **Contabilidad Electrónica (CONE)** — Generación de XMLs SAT v1.3 (Catálogo, Balanza, Pólizas, Auxiliar) desde SAP B1 con resolución interactiva de cuentas sin `U_COD_AG`.
- *(WIP)* Resto de módulos del SCTF (Bancos, Pagos, Conciliaciones, etc.)

## Requisitos

- Node 20 LTS
- Angular CLI 18.2.x
- Backend SCTF corriendo (por defecto en `https://localhost:7053` — configurable en `src/environments/`).

## Comandos

```bash
npm install              # instala dependencias
npm start                # ng serve → http://localhost:4200
npm run build            # build production a dist/SCTF-09-2025-Frontend
npm run watch            # build con --watch en dev
npm test                 # tests con Karma
```

## Estructura

```
src/app/
├── app.{component,config,routes}.ts   Bootstrap Angular + MSAL
├── azure/                              Configuración MSAL Azure AD
├── shared/                             Servicios, guards, interfaces y helpers comunes
│   └── services/
│       ├── http-client.service.ts     Wrapper de HttpClient con environment.apiUrl
│       ├── toast.service.ts           Wrapper PrimeNG MessageService + .apiError()
│       └── api-error.helper.ts        Parseo estandarizado de HttpErrorResponse
└── modules/
    ├── admin/                          Login, server-error, auth
    ├── layout/                         Sidebar, topbar, footer, layout principal
    └── contabilidad-electronica/       Módulo CONE
        ├── pages/
        │   ├── dashboard/
        │   ├── cuentas-sin-agrupador/
        │   ├── configuracion/
        │   ├── historial/
        │   └── wizard-generacion/
        ├── services/cone.service.ts
        └── models/cone.models.ts
```

## Convenciones

- **Standalone components** (sin NgModules).
- **Signals** para estado local de componente; `subscribe` para flujos HTTP.
- **Lazy loading** por módulo en `app.routes.ts`.
- **PrimeNG `appendTo="body"`** en dropdowns dentro de tablas / dialogs.
- **Errores HTTP**: usar `toast.apiError(err, 'prefijo')` para mensajes estandarizados con `traceId`.
