import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // FIXED: Check sessionStorage
  const token = sessionStorage.getItem('token');

  if (!token) {
    router.navigate(['/']); 
    return false;
  }
  return true;
};