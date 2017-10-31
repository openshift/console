// Allow importing other file types

declare module '*.svg' {
  const value: any;
  export = value;
}
