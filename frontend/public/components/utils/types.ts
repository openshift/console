/*
  Add the enum for NameValueEditorPair here and not in its namesake file because the editor should always be
  loaded asynchronously in order not to bloat the vendor file. The enum reference into the editor
  will cause it not to load asynchronously.
 */
export const enum NameValueEditorPair {
  Name = 0,
  Value,
  Index,
}

export const enum EnvFromPair {
  Prefix = 0,
  Resource,
  Index,
}
/**
 * The environment editor manages two types of env variables env and envFrom. This const distinguishes the two.
 */
export const enum EnvType {
  ENV = 0,
  ENV_FROM = 1,
}

export type HumanizeResult = {
  string: string;
  value: number;
  unit: string;
};

export type Humanize = {
  (v: React.ReactText, initialUnit?: string, preferredUnit?: string): HumanizeResult;
};

export enum NotificationTypes {
  info = 'info',
  warning = 'warning',
  critical = 'danger',
  success = 'success',
}
