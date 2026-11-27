import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { registerLocaleData } from '@angular/common';
import localeEsBo from '@angular/common/locales/es-BO';
registerLocaleData(localeEsBo);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-BO' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
