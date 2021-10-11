import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import detector from 'i18next-browser-languagedetector';
import httpBackend from 'i18next-http-backend';
import Pseudo from 'i18next-pseudo';
import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';

import { pluginStore } from './plugins';
import { dateTimeFormatter, fromNow } from './components/utils/datetime';

const params = new URLSearchParams(window.location.search);
const pseudolocalizationEnabled = params.get('pseudolocalization') === 'true';

export const init = () => {
  i18n
    .use(new Pseudo({ enabled: pseudolocalizationEnabled, wrapped: true }))
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
        loadPath: '/locales/resource.json?lng={{lng}}&ns={{ns}}',
      },
      lng: getLastLanguage(),
      fallbackLng: 'en',
      load: 'languageOnly',
      debug: process.env.NODE_ENV === 'development',
      detection: { caches: [] },
      contextSeparator: '~',
      ns: [
        'ceph-storage-plugin',
        'console-app',
        'console-shared',
        'container-security',
        'devconsole',
        'git-service',
        'gitops-plugin',
        'helm-plugin',
        'insights-plugin',
        'knative-plugin',
        'kubevirt-plugin',
        'lso-plugin',
        'metal3-plugin',
        'notification-drawer',
        'olm',
        'pipelines-plugin',
        'public',
        'rhoas-plugin',
        'topology',
        ...pluginStore.getAllowedDynamicPluginNames().map((name) => `plugin__${name}`),
      ],
      defaultNS: 'public',
      nsSeparator: '~',
      keySeparator: false,
      postProcess: ['pseudo'],
      interpolation: {
        format: function(value, format, lng, options) {
          if (format === 'number') {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat#Browser_compatibility
            return new Intl.NumberFormat(lng).format(value);
          }
          if (value instanceof Date) {
            if (format === 'fromNow') {
              return fromNow(value, null, options);
            }
            return dateTimeFormatter.format(value);
          }
          return value;
        },
        escapeValue: false, // not needed for react as it escapes by default
      },
      react: {
        useSuspense: true,
        wait: true,
        transSupportBasicHtmlNodes: true, // allow <br/> and simple html elements in translations
      },
      saveMissing: true,
      missingKeyHandler: function(lng, ns, key) {
        window.windowError = `Missing i18n key "${key}" in namespace "${ns}" and language "${lng}."`;
        // eslint-disable-next-line no-console
        console.error(window.windowError);
      },
    });
};

export default i18n;
