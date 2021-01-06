import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import detector from 'i18next-browser-languagedetector';
import httpBackend from 'i18next-http-backend';
import Pseudo from 'i18next-pseudo';

import { dateTimeFormatter, fromNow } from './components/utils/datetime';

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
      fallbackLng: 'en',
      load: 'all',
      debug: process.env.NODE_ENV === 'development',
      detection: { caches: [] },
      contextSeparator: '~',
      ns: [
        'alert-manager-config',
        'alert-manager-receiver-forms',
        'alert-manager-yaml-editor',
        'alert-routing-modal',
        'api-explorer',
        'badge',
        'build',
        'build-config',
        'build-strategy',
        'basicauth-idp-form',
        'catalog-source',
        'ceph-storage-plugin',
        'cloudshell',
        'cluster-channel-modal',
        'cluster-operator',
        'cluster-settings',
        'cluster-update-modal',
        'cluster-version',
        'console-app',
        'console-shared',
        'container-security',
        'create-catalog-source',
        'custom-resource-definition',
        'dashboard',
        'details-page',
        'devconsole',
        'dropdown',
        'editor',
        'email-receiver-form',
        'environment',
        'events',
        'filter-toolbar',
        'github-idp-form',
        'gitlab-idp-form',
        'git-service',
        'gitops-plugin',
        'global-config',
        'google-idp-form',
        'helm-plugin',
        'htpasswd-idp-form',
        'idp-cafile-input',
        'idp-name-input',
        'image-stream',
        'ingress',
        'knative-plugin',
        'keystone-idp-form',
        'kubevirt-plugin',
        'language-preferences-modal',
        'ldap-idp-form',
        'limit-range',
        'logs',
        'list-page',
        'lso-plugin',
        'masthead',
        'machines',
        'machine-autoscalers',
        'machine-configs',
        'machine-config-pools',
        'machine-health-checks',
        'machine-sets',
        'metal3-plugin',
        'modal',
        'monitoring',
        'namespace',
        'nav',
        'network-policy',
        'network-route',
        'network-service',
        'nodes',
        'noobaa-storage-plugin',
        'oauth',
        'openid-idp-form',
        'operator-hub-details',
        'operator-hub-subscribe',
        'operator-install-page',
        'operator-lifecycle-manager',
        'pagerduty-receiver-form',
        'pipelines-plugin',
        'public',
        'quickstart',
        'related-objects',
        'request-header-idp-form',
        'resource-quota',
        'routing-labels-editor',
        'search',
        'secret',
        'sidebar',
        'slack-receiver-form',
        'storage',
        'subscription',
        'topology',
        'tour',
        'utils',
        'webhook-receiver-form',
        'workload',
        'yaml',
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
          return dateTimeFormatter.format(value);
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
      window.windowError = `Missing i18n key "${key}" in namespace "${ns}" and language "${lng}."`;
      // eslint-disable-next-line no-console
      console.error(window.windowError);
    },
  });

export default i18n;
