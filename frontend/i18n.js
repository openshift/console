import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import detector from 'i18next-browser-languagedetector';
import httpBackend from 'i18next-http-backend';

// Load moment.js locales (en is default and always loaded)
import 'moment/locale/zh-cn';
import 'moment/locale/ja';
import moment from 'moment';

const { FALLBACK_LOCALE } = require('./i18next-parser.config');

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
  .init(
    {
      backend: {
        loadPath: 'static/locales/{{lng}}/{{ns}}.json',
      },
      fallbackLng: FALLBACK_LOCALE,
      load: 'languageOnly',
      debug: process.env.NODE_ENV === 'development',
      detection: { caches: [] },
      ns: ['public', 'nav'],
      defaultNS: 'public',
      nsSeparator: '~',
      interpolation: {
        format: function(value, format, lng, options) {
          if (format === 'number') {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat#Browser_compatibility
            return new Intl.NumberFormat(lng).format(value);
          }
          if (value instanceof Date) {
            if (format === 'fromNow') {
              return moment(value).fromNow(options.omitSuffix === true);
            }
            return moment(value).format(format);
          }
          return value;
        },
        escapeValue: false, // not needed for react as it escapes by default
      },
      react: {
        useSuspense: false,
        wait: true,
      },
    },
    () => {
      moment.locale(i18n.language === 'zh' ? 'zh-cn' : i18n.language);
    },
  );

i18n.on('languageChanged', function(lng) {
  moment.locale(lng === 'zh' ? 'zh-cn' : lng);
});

export default i18n;
