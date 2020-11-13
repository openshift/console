import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import detector from 'i18next-browser-languagedetector';
import httpBackend from 'i18next-http-backend';
import Pseudo from 'i18next-pseudo';

// Load moment.js locales (en is default and always loaded)
import 'moment/locale/zh-cn';
import 'moment/locale/ja';
import 'moment/locale/en-gb';
import moment from 'moment';

import { FALLBACK_LOCALE } from './i18next-parser.config';
const params = new URLSearchParams(window.location.search);
const pseudolocalizationEnabled = params.get('pseudolocalization') === 'true';

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
  .init(
    {
      backend: {
        loadPath: 'static/locales/{{lng}}/{{ns}}.json',
      },
      lng: localStorage.getItem('bridge/language'),
      fallbackLng: FALLBACK_LOCALE,
      load: 'all',
      debug: process.env.NODE_ENV === 'development',
      detection: { caches: [] },
      ns: [
        'alert-manager-config',
        'alert-manager-receiver-forms',
        'alert-manager-yaml-editor',
        'alert-routing-modal',
        'badge',
        'build',
        'build-config',
        'build-strategy',
        'basicauth-idp-form',
        'catalog-source',
        'cloudshell',
        'cluster-channel-modal',
        'cluster-operator',
        'cluster-settings',
        'cluster-update-modal',
        'cluster-version',
        'console-app',
        'create-catalog-source',
        'custom-resource-definition',
        'dashboard',
        'details-page',
        'editor',
        'email-receiver-form',
        'github-idp-form',
        'gitlab-idp-form',
        'global-config',
        'google-idp-form',
        'htpasswd-idp-form',
        'idp-cafile-input',
        'idp-name-input',
        'image-stream',
        'keystone-idp-form',
        'language-preferences-modal',
        'kubevirt-plugin',
        'ldap-idp-form',
        'limit-range',
        'logs',
        'masthead',
        'machines',
        'machine-autoscalers',
        'machine-configs',
        'machine-config-pools',
        'machine-health-checks',
        'machine-sets',
        'modal',
        'monitoring',
        'nav',
        'nodes',
        'oauth',
        'openid-idp-form',
        'operator-hub-details',
        'operator-hub-subscribe',
        'operator-install-page',
        'pagerduty-receiver-form',
        'pipelines-plugin',
        'public',
        'quickstart',
        'related-objects',
        'request-header-idp-form',
        'resource-quota',
        'routing-labels-editor',
        'search',
        'sidebar',
        'slack-receiver-form',
        'subscription',
        'tour',
        'utils',
        'webhook-receiver-form',
        'yaml',
        'network-service',
        'network-route',
        'network-policy',
        'ingress',
        'console-shared',
        'workload',
        'devconsole',
        'knative-plugin',
        'kubevirt-plugin',
        'container-security',
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
              return moment(value).fromNow(options.omitSuffix === true);
            }
            return moment(value).format(format);
          }
          return value;
        },
        escapeValue: false, // not needed for react as it escapes by default
      },
      react: {
        useSuspense: true,
        wait: true,
      },
      saveMissing: true,
      missingKeyHandler: function(lng, ns, key) {
        window.windowError = new Error(
          `Missing i18n key "${key}" in namespace "${ns}" and language "${lng}."`,
        );
        // eslint-disable-next-line no-console
        console.error(`Missing i18n key "${key}" in namespace "${ns}" and language "${lng}."`);
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
