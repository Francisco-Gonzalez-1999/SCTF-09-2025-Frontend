import { CanActivateFn, Router } from "@angular/router";
import { inject } from '@angular/core';
import { AuthService } from "../../modules/admin/services/auth.service";

export const isLoggedIn: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  // console.log("isLoggedIn: ", authService.isLoggedIn)

  if (authService.isLoggedIn) {
    return true;
  } else {
    router.navigate(['auth/login'])
    return false;
  }
};

export const isNotLoggedIn: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  // console.log("isNotLoggedIn: ", !authService.isLoggedIn);

  if (!authService.isLoggedIn) {
    return true;
  } else {
    router.navigate([''])
    return false;
  }
}
