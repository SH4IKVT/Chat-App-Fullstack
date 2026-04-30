import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrieve the stored credentials[cite: 2]
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');

  // If a token exists, clone the request and add the Authorization header[cite: 2]
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`, // Must include 'Bearer ' prefix[cite: 2]
        'X-Session-Id': sessionId || ''
      }
    });

    return next(cloned);
  }

  // If no token, send the original request[cite: 2]
  return next(req);
};