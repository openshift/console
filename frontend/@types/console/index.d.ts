/// <reference path="./i18next.d.ts" />
/// <reference path="./dynamic-plugin-sdk.d.ts" />
/// <reference path="./window.d.ts" />

declare module 'linkify-react' {
  import type { FC, ReactNode } from 'react';
  import type { Opts } from 'linkifyjs';

  const Linkify: FC<{ options?: Opts; children?: ReactNode }>;
  export default Linkify;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}
