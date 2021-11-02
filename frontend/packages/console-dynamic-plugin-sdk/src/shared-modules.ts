/**
 * Modules shared between the Console application and its dynamic plugins.
 */
export const sharedPluginModules = {
  '@openshift-console/dynamic-plugin-sdk': {
    singleton: true,
  },
  '@openshift-console/dynamic-plugin-sdk-internal': {
    singleton: true,
  },
  '@openshift-console/dynamic-plugin-sdk-internal-kubevirt': {
    singleton: true,
  },
  '@patternfly/react-core': {
    singleton: true,
  },
  '@patternfly/react-table': {
    singleton: true,
  },
  react: {
    singleton: true,
  },
  'react-helmet': {
    singleton: true,
  },
  'react-i18next': {
    singleton: true,
  },
  'react-router': {
    singleton: true,
  },
  'react-router-dom': {
    singleton: true,
  },
};
