declare interface Window {
  /** See pkg/server/server.go */
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
    kubeAdminLogoutURL: string;
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
    /** JSON encoded configuration for the console's feature flags */
    addPage: string;
    /** Console dynamic plugins enabled on the cluster */
    consolePlugins: string[];
    /** Available i18n namespaces */
    i18nNamespaces: string[];
    projectAccessClusterRoles: string;
    controlPlaneTopology: string;
    telemetry?: Partial<{
      /** All of the following should be always available on prod env. */
      SEGMENT_API_HOST: string;
      SEGMENT_JS_HOST: string;
      /** One of the following should be always available on prod env. */
      SEGMENT_API_KEY: string;
      SEGMENT_PUBLIC_API_KEY: string;
      DEVSANDBOX_SEGMENT_API_KEY: string;
      /** Optional override for analytics.min.js script URL */
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
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  /** (OCPBUGS-46415) Do not override this string! To add new errors please append to windowError if it exists */
  windowError?: string;
  /** i18next instance, only available in development builds for debugging */
  i18n?: {};
  /** Redux store, only available in development builds for debugging */
  store?: {};
  /** Console plugin store, only available in development builds for debugging */
  pluginStore?: {};
  /** Console legacy plugin entry callback, used to load dynamic plugins */
  loadPluginEntry?: Function;
  /** Console plugin entry callback, used to load dynamic plugins */
  __load_plugin_entry__?: Function;
  /** webpack shared scope object */
  webpackSharedScope?: {};
  /** The global monaco object, exposed when the Monaco Editor is loaded */
  monaco?: {};
}
