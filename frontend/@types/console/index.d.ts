/// <reference path="./i18next.d.ts" />
/// <reference path="./dynamic-plugin-sdk.d.ts" />
/// <reference path="./generated/graphql-queries.d.ts" />

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare interface Window {
  SERVER_FLAGS: {
    copiedCSVsDisabled: boolean;
    alertManagerBaseURL: string;
    alertmanagerUserWorkloadBaseURL: string;
    authDisabled: boolean;
    basePath: string;
    branding: string;
    consoleVersion: string;
    customLogoURL: string;
    customLogosConfigured: boolean;
    customFaviconsConfigured: boolean;
    customProductName: string;
    documentationBaseURL: string;
    kubeAPIServerURL: string;
    loadTestFactor: number;
    loginErrorURL: string;
    loginSuccessURL: string;
    loginURL: string;
    logoutRedirect: string;
    logoutURL: string;
    prometheusBaseURL: string;
    prometheusTenancyBaseURL: string;
    quickStarts: string;
    releaseVersion: string;
    inactivityTimeout: number;
    statuspageID: string;
    GOARCH: string;
    GOOS: string;
    graphqlBaseURL: string;
    developerCatalogCategories: string;
    perspectives: string;
    developerCatalogTypes: string;
    userSettingsLocation: string;
    addPage: string; // JSON encoded configuration
    consolePlugins: string[]; // Console dynamic plugins enabled on the cluster
    i18nNamespaces: string[]; // Available i18n namespaces
    quickStarts: string;
    projectAccessClusterRoles: string;
    controlPlaneTopology: string;
    telemetry?: Partial<{
      // All of the following should be always available on prod env.
      SEGMENT_API_HOST: string;
      SEGMENT_JS_HOST: string;
      // One of the following should be always available on prod env.
      SEGMENT_API_KEY: string;
      SEGMENT_PUBLIC_API_KEY: string;
      DEVSANDBOX_SEGMENT_API_KEY: string;
      // Optional override for analytics.min.js script URL
      SEGMENT_JS_URL: string;
      // Additional telemetry options passed to Console frontend
      DEBUG: 'true' | 'false';
      DISABLED: 'true' | 'false';
      [name: string]: string;
    }>;
    nodeArchitectures: string[];
    nodeOperatingSystems: string[];
    hubConsoleURL: string;
    k8sMode: string;
    techPreview: boolean;
    capabilities: {
      name: string;
      visibility: { state: 'Enabled' | 'Disabled' };
    }[];
  };
  /** (OCPBUGS-46415) Do not override this string! To add new errors please append to windowError if it exists*/
  windowError?: string;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  i18n?: {}; // i18next instance, only available in development builds for debugging
  store?: {}; // Redux store, only available in development builds for debugging
  pluginStore?: {}; // Console plugin store
  loadPluginEntry?: Function; // Console plugin entry callback, used to load dynamic plugins
  webpackSharedScope?: {}; // webpack shared scope object
  Cypress?: {};
  monaco?: {};
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
declare type Diff<T, K> = Omit<T, keyof K>;
