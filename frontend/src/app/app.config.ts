import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './interceptors/auth.interceptor';

import { routes } from './app.routes';

// 🔥 ADD THESE
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // 🔥 THIS IS THE IMPORTANT PART
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};