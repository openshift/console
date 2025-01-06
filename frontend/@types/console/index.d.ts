/// <reference path="./react.d.ts" />
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
    telemetry: Record<string, string>;
    nodeArchitectures: string[];
    nodeOperatingSystems: string[];
    hubConsoleURL: string;
    k8sMode: string;
    capabilities: Record<string, string>[];
  };
  /** (OCPBUGS-46415) Do not override this string! To add new errors please append to windowError if it exists*/
  windowError?: string;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  i18n?: {}; // i18next instance, only available in development builds for debugging
  store?: {}; // Redux store, only available in development builds for debugging
  pluginStore?: {}; // Console plugin store
  loadPluginEntry?: Function; // Console plugin entry callback, used to load dynamic plugins
  webpackSharedScope?: {}; // webpack shared scope object, contains modules shared across plugins
  ResizeObserver: ResizeObserver.prototype; // polyfill used by react-measure
  Cypress?: {};
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
declare type Diff<T, K> = Omit<T, keyof K>;
