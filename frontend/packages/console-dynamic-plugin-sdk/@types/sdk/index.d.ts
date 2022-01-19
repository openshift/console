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
    clusters: string[];
    projectAccessClusterRoles: string;
  };
  pluginStore: {}; // Redux store
  store?: {}; // Redux store
  windowError?: string;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
}

// TODO: Remove when upgrading to TypeScript 4.1.2+, which has a type for ListFormat and RelativeTimeFormat.
declare namespace Intl {
  type ListFormatOptions = {
    localeMatcher: string;
    type: string;
    style: string;
  };

  class ListFormat {
    constructor(locales?: Locale | string | undefined, options?: Partial<ListFormatOptions>);
    public format(list?: Iterable<string>): string;
  }

  class RelativeTimeFormat {
    constructor(locale: string);
    format(n: number, unit: string);
  }
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
declare type Diff<T, K> = Omit<T, keyof K>;

declare module '*/features.gql' {
  import { DocumentNode } from 'graphql';
  const defaultDocument: DocumentNode;
  export const SSARQuery: DocumentNode;

  export default defaultDocument;
}


declare module '*/client.gql' {
  import { DocumentNode } from 'graphql';
  const defaultDocument: DocumentNode;
  export const URLQuery: DocumentNode;

  export default defaultDocument;
}
