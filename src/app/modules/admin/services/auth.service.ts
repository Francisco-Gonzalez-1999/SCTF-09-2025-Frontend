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

  loginWithPopup() {
    this.isLoading.next(true);

    this.msalService.loginPopup({
      scopes: ['api://a23f820f-9edc-49ae-acd6-44c32aa407ab/default']
    }).subscribe({
      next: (authResponse) => {
        this.msalService.instance.setActiveAccount(authResponse.account);
        this.setUserData(authResponse.account);
        this.router.navigate(['/home']);
        this.isLoading.next(false);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isLoading.next(false);
      }
    });
  }

  logout() {
    this.msalService.logoutPopup({
      postLogoutRedirectUri: window.location.origin
    }).subscribe({
      next: () => {
        this.userData.next(null);
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.router.navigate(['/auth']);
      }
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
