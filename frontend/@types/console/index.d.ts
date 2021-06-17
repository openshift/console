/// <reference path="./react.d.ts" />
/// <reference path="./ResizeObserver.d.ts" />
/// <reference path="./generated/graphql-queries.d.ts" />

declare module '*.svg' {
  const value: any;
  export = value;
}
declare module '*.png' {
  const value: any;
  export = value;
}

declare interface Window {
  SERVER_FLAGS: {
    alertManagerBaseURL: string;
    authDisabled: boolean;
    basePath: string;
    branding: string;
    consoleVersion: string;
    customLogoURL: string;
    customProductName: string;
    documentationBaseURL: string;
    kubeAPIServerURL: string;
    kubeAdminLogoutURL: string;
    kubectlClientID: string;
    loadTestFactor: number;
    loginErrorURL: string;
    loginSuccessURL: string;
    loginURL: string;
    logoutRedirect: string;
    logoutURL: string;
    meteringBaseURL: string;
    prometheusBaseURL: string;
    prometheusTenancyBaseURL: string;
    quickStarts: string;
    requestTokenURL: string;
    inactivityTimeout: number;
    statuspageID: string;
    GOARCH: string;
    GOOS: string;
    graphqlBaseURL: string;
    developerCatalogCategories: string;
    userSettingsLocation: string;
    addPage: string; // JSON encoded configuration
    consolePlugins: string[]; // Console dynamic plugins enabled on the cluster
    quickStarts: string;
    projectAccessClusterRoles: string;
  };
  windowError?: string;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  store?: {}; // Redux store
  pluginStore?: {}; // Console plugin store
  loadPluginEntry?: Function;
  loadPluginFromURL?: Function;
  Cypress?: {};
  api: {};
}

// TODO: Remove when upgrading to TypeScript 4.1.2+, which has a type for RelativeTimeFormat.
declare namespace Intl {
  class RelativeTimeFormat {
    constructor(locale: string);
    format(n: number, unit: string);
  }
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
declare type Diff<T, K> = Omit<T, keyof K>;
