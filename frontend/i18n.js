import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import detector from 'i18next-browser-languagedetector';
import httpBackend from 'i18next-http-backend';

// Load moment.js locales (en is default and always loaded)
import arLocale from 'moment/locale/ar';
import zhLocale from 'moment/locale/zh-cn';
import deLocale from 'moment/locale/de';
import moment from 'moment';

const { DEFAULT_LOCALE } = require('./i18next-parser.config');

// Set default locale
moment.locale(DEFAULT_LOCALE);

i18n
  // fetch json files
  // learn more: https://github.com/i18next/i18next-http-backend
  .use(httpBackend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(detector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    backend: {
      loadPath: 'static/locales/{{lng}}/{{ns}}.json'
    },
    fallbackLng: DEFAULT_LOCALE,
    load: 'languageOnly',
    debug: process.env.NODE_ENV === 'development',
    ns: ['public', 'nav'],
    defaultNS: 'public',
    nsSeparator: '~',
    interpolation: {
      format: function(value, format, lng) {
        if (value instanceof Date) {
          return moment(value).format(format);
        }
        return value;
      },
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false,
      wait: true
    }
  });


export default i18n; 