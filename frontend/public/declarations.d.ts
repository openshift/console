/* eslint-disable no-undef, no-unused-vars */

// Allow importing other file types
declare module '*.svg' {
  const value: any;
  export = value;
}

// Diff / Omit taken from https://github.com/Microsoft/TypeScript/issues/12215#issuecomment-311923766
declare type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
declare type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;
