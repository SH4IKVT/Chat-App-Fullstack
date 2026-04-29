import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');

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