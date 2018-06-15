/* eslint-disable no-undef, no-unused-vars */

// Allow importing other file types
declare module '*.svg' {
  const value: any;
  export = value;
}

// From https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
declare type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
