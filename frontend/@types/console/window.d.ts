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
    developerCatalogCategories: string;
    /** JSON encoded configuration for the console's perspectives override */
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
      /**
       * The API host to which the Segment script will talk to. Defaults to
       * "api.segment.io/v1" if undefined.
       */
      SEGMENT_API_HOST?: string;
      /**
       * Segment's CDN url setting, which must include "https://" and no
       * trailing slashes. Defaults to "https://cdn.segment.com" if undefined.
       */
      SEGMENT_CDN_URL?: string;
      /**
       * Legacy way of specifying Segment's CDN host.
       * @deprecated Use `SEGMENT_CDN_URL` instead.
       */
      SEGMENT_JS_HOST: string;
      /** One of the following should be always available on prod env. */
      SEGMENT_API_KEY: string;
      SEGMENT_PUBLIC_API_KEY: string;
      // DevSandbox-specific configuration
      DEVSANDBOX_SEGMENT_API_KEY: string;
      DEVSANDBOX: 'true' | 'false';
      /**
       * Legacy way of specifying the full URL from which the Segment script
       * would be loaded.
       * @deprecated Use `SEGMENT_CDN_URL` instead because the Segment
       * script is now bundled in the UI. Given a full URL like "https://example.redhat.com/cdn/analytics.js/v1/segmentKey/analytics.min.js",
       * only the part of the URL until "/analytics.js/v1" is used, excluding
       * that part.
       */
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
    olmLifecycleMetadata: boolean;
    capabilities: {
      name: string;
      visibility: { state: 'Enabled' | 'Disabled' };
    }[];
  };
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  /** (OCPBUGS-46415) Do not override this string! To add new errors, append to `windowError` if it exists */
  windowError?: string;
  /** i18next instance, only available in development builds for debugging */
  i18n?: {};
  /** Redux store, only available in development builds for debugging */
  store?: {};
  /** Shared scope object used by Console and its plugins (development builds only) */
  pluginSharedScope?: {};
  /** Console plugin store only available in development builds for debugging */
  pluginStore?: {};
  /** Console legacy plugin entry callback for loading dynamic plugins (4.21 and older) */
  loadPluginEntry?: Function;
  /** Console plugin entry callback for loading dynamic plugins (4.22 and newer) */
  __load_plugin_entry__?: Function;
  /** The global monaco object, exposed when the Monaco Editor is loaded */
  monaco?: {};
}
