// Allow importing other file types
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
    googleTagManagerID: string;
    kubeAPIServerURL: string;
    kubeAdminLogoutURL: string;
    kubectlClientID: string;
    loadTestFactor: number
    loginErrorURL: string;
    loginSuccessURL: string;
    loginURL: string;
    logoutRedirect: string;
    logoutURL: string;
    meteringBaseURL: string;
    prometheusBaseURL: string;
    prometheusTenancyBaseURL: string;
    requestTokenURL: string;
    statuspageID: string;
  };
  windowError?: boolean;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
  store?: {}; // Redux store for debugging
  pluginStore?: {}; // Console plugin store for debugging
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
// TODO(vojtech): TypeScript 3.5 adds Omit to the standard library
declare type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
declare type Diff<T, K> = Omit<T, keyof K>;
