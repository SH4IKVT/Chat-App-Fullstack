import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const token = localStorage.getItem('token');

  // 🔥 IF NOT LOGGED IN
  if (!token) {
    console.log("Access denied. No token.");

    router.navigate(['/']); // redirect to login
    return false;
  }

  // 🔥 ALLOWED
  return true;
};