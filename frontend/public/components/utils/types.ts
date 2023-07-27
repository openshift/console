import {
  K8sResourceKindReference,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { Selector } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { K8sResourceKind } from '../../module/k8s/types';

export type FirehoseResult<
  R extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceKind[]
> = {
  loaded: boolean;
  loadError: string;
  optional?: boolean;
  data: R;
  kind?: string;
};

export type FirehoseResultObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] };

export type FirehoseResourcesResult<
  R extends FirehoseResultObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] }
> = {
  [k in keyof R]: FirehoseResult<R[k]>;
};

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

export type FirehoseResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  prop: string;
  namespaced?: boolean;
  optional?: boolean;
  limit?: number;
  fieldSelector?: string;
};

export type HumanizeResult = {
  string: string;
  value: number;
  unit: string;
};

export type Humanize = {
  (v: React.ReactText, initialUnit?: string, preferredUnit?: string): HumanizeResult;
};
