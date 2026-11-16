import { createInstance } from 'i18next';

import en from '@/locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}

const i18n = createInstance();

// Bundled resources initialize synchronously, including outside the React entry point.
void i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false }, // React escapes the rendered text.
});

export const t = i18n.t;
