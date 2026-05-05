import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // FIXED: Retrieve from sessionStorage
  const token = sessionStorage.getItem('token');
  const sessionId = sessionStorage.getItem('sessionId');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`, 
        'X-Session-Id': sessionId || ''
      }
    });
    return next(cloned);
  }
  return next(req);
};