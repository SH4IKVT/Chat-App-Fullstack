import {
  HttpInterceptorFn
} from "@angular/common/http";

export const authInterceptor:
HttpInterceptorFn = (req, next) => {

  const token =
    sessionStorage.getItem('token');

  const tabId =
    sessionStorage.getItem('tabId');

  if (token) {

    const cloned = req.clone({

      setHeaders: {

        Authorization:
          `Bearer ${token}`,

        'X-Tab-Id':
          tabId || ''

      }

    });

    return next(cloned);

  }

  return next(req);

};