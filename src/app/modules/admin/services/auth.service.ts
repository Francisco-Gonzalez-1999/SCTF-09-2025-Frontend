import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData = new BehaviorSubject<any>(null);
  userData$ = this.userData.asObservable();
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    private msalService: MsalService,
    private router: Router
  ) {
    this.initialize();
  }

  private initialize() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalService.instance.setActiveAccount(accounts[0]);
      this.setUserData(accounts[0]);
    }
  }

  getUserData() {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      return {
        name: account.name,
        username: account.username,
        email: account.idTokenClaims?.emails?.[0] || account.username,
        roles: account.idTokenClaims?.roles || []
      };
    }
    return null;
  }

  private setUserData(account: any) {
    this.userData.next(this.getUserDataFromAccount(account));
  }

  private getUserDataFromAccount(account: any) {
    return {
      name: account.name,
      username: account.username,
      email: account.idTokenClaims?.emails?.[0] || account.username,
      roles: account.idTokenClaims?.roles || []
    };
  }

  /**
   * Inicia el flujo MSAL por REDIRECT: navega al login de Microsoft y al volver
   * la app se recarga con el codigo en la URL. El procesamiento del callback
   * se hace en handleRedirectCallback() (llamado desde AppComponent al iniciar).
   *
   * A diferencia de loginPopup, este metodo NO regresa un Observable de
   * autenticacion — la pagina se redirige antes de que termine la promise.
   */
  loginRedirect() {
    this.isLoading.next(true);
    this.msalService.loginRedirect({
      scopes: ['api://a23f820f-9edc-49ae-acd6-44c32aa407ab/default']
    });
  }

  /**
   * Se llama UNA vez al inicio de la app (desde AppComponent.ngOnInit) para
   * procesar el callback de Microsoft despues de loginRedirect. Si la URL
   * actual NO trae el codigo de auth, el observable emite null y no pasa nada.
   */
  handleRedirectCallback() {
    return this.msalService.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result && result.account) {
          this.msalService.instance.setActiveAccount(result.account);
          this.setUserData(result.account);
          this.isLoading.next(false);
          this.router.navigate(['/']);
        } else {
          // No fue un retorno de redirect (carga normal). Solo refresca el
          // estado por si ya habia una sesion en cache.
          this.initialize();
        }
      },
      error: (err) => {
        console.error('[MSAL] Error procesando redirect callback:', err);
        this.isLoading.next(false);
      }
    });
  }

  logout() {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin
    });
  }

  get isLoggedIn(): boolean {
    // console.log("isLoggedIn: ", this.msalService.instance.getAllAccounts().length > 0)
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  getAccessToken() {
    const account = this.msalService.instance.getActiveAccount();
    if (!account) {
      throw new Error('No active account');
    }

    return this.msalService.acquireTokenSilent({
      scopes: ['api://a23f820f-9edc-49ae-acd6-44c32aa407ab/default'],
      account: account
    });
  }

  reloadUserData() {
    const userData = this.getUserData();
    if (userData) {
      this.userData.next(userData);
    }
  }

}
