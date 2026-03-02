/// <reference path="./i18next.d.ts" />
/// <reference path="./dynamic-plugin-sdk.d.ts" />
/// <reference path="./window.d.ts" />
/// <reference path="./generated/graphql-queries.d.ts" />

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}
