import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ko from './ko.json';

const options = {
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
  cookieMinutes: 7 * 24 * 60 * 60 * 1000,
};

const resource = {
  en: {
    translation: en,
  },
  ko: {
    translation: ko,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    //lng: 'en',
    lng: window.localStorage.getItem('i18nextLng') || navigator.language || 'ko',
    debug: true,
    detection: options,
    resources: resource,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
