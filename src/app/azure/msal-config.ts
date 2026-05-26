import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { environment } from '../../environments/environment';

export const msalConfig = {
  auth: {
    clientId: environment.msal.clientId,
    authority: environment.msal.authority,
    redirectUri: environment.msal.redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

export const protectedResources = {
  api: {
    endpoint: environment.apiUrl, // La propiedad protectedResources.api.endpoint se utiliza para decirle al MSAL Interceptor cuáles endpoints del API están protegidos y necesitan que se envíe un token de acceso en el Authorization Header de la solicitud.
    scopes: environment.msal.scopes
  }
};

// Oye MSAL, cada vez que se haga una petición a environment.apiUrl, añade automáticamente el token de acceso que tenga el scope api://<clientId>/default.

export const loginRequest = {
  scopes: environment.msal.scopes
};

export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: loginRequest
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
      [protectedResources.api.endpoint, protectedResources.api.scopes]
    ])
  };
}
