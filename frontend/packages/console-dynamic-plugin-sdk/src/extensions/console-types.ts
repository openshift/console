import { JSONSchema7 } from 'json-schema';
import { RouteComponentProps } from 'react-router';
import {
  ExtensionK8sGroupKindModel,
  PrometheusLabels,
  PrometheusValue,
  ResolvedExtension,
} from '../api/common-types';
import { Extension, ExtensionTypeGuard } from '../types';

export type OwnerReference = {
  name: string;
  kind: string;
  uid: string;
  apiVersion: string;
  controller?: boolean;
  blockOwnerDeletion?: boolean;
};

export type ObjectReference = {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  resourceVersion?: string;
  fieldPath?: string;
};

export type ObjectMetadata = {
  annotations?: { [key: string]: string };
  clusterName?: string;
  creationTimestamp?: string;
  deletionGracePeriodSeconds?: number;
  deletionTimestamp?: string;
  finalizers?: string[];
  generateName?: string;
  generation?: number;
  labels?: { [key: string]: string };
  managedFields?: any[];
  name?: string;
  namespace?: string;
  ownerReferences?: OwnerReference[];
  resourceVersion?: string;
  uid?: string;
};

// Properties common to (almost) all Kubernetes resources.
export type K8sResourceCommon = {
  apiVersion?: string;
  kind?: string;
  metadata?: ObjectMetadata;
};

export type K8sVerb =
  | 'create'
  | 'get'
  | 'list'
  | 'update'
  | 'patch'
  | 'delete'
  | 'deletecollection'
  | 'watch';

export type AccessReviewResourceAttributes = {
  group?: string;
  resource?: string;
  subresource?: string;
  verb?: K8sVerb;
  name?: string;
  namespace?: string;
};

export type MatchExpression = {
  key: string;
  operator: 'Exists' | 'DoesNotExist' | 'In' | 'NotIn' | 'Equals' | 'NotEqual';
  values?: string[];
  value?: string;
};

export type MatchLabels = {
  [key: string]: string;
};

export type Selector = {
  matchLabels?: MatchLabels;
  matchExpressions?: MatchExpression[];
};

/**
 * GroupVersionKind unambiguously identifies a kind.
 * https://godoc.org/k8s.io/apimachinery/pkg/runtime/schema#GroupVersionKind
 * TODO: Change this to a regex-type if it ever becomes a thing (https://github.com/Microsoft/TypeScript/issues/6579)
 */
export type GroupVersionKind = string;

/**
 * The canonical, unique identifier for a Kubernetes resource type.
 * Maintains backwards-compatibility with references using the `kind` string field.
 */
export type K8sResourceKindReference = GroupVersionKind | string;

enum InventoryStatusGroup {
  WARN = 'WARN',
  ERROR = 'ERROR',
  PROGRESS = 'PROGRESS',
  NOT_MAPPED = 'NOT_MAPPED',
  UNKNOWN = 'UNKNOWN',
}

type StatusGroup = {
  [key in InventoryStatusGroup | string]: {
    filterType?: string;
    statusIDs: string[];
    count: number;
  };
};

export type StatusGroupMapper<
  T extends K8sResourceCommon = K8sResourceCommon,
  R extends { [key: string]: K8sResourceCommon[] } = { [key: string]: K8sResourceCommon[] }
> = (resources: T[], additionalResources?: R) => StatusGroup;

export enum HealthState {
  OK = 'OK',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  LOADING = 'LOADING',
  UNKNOWN = 'UNKNOWN',
  UPDATING = 'UPDATING',
  PROGRESS = 'PROGRESS',
  UPGRADABLE = 'UPGRADABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

// Only covers range and instant vector responses for now.
export type PrometheusResult = {
  metric: PrometheusLabels;
  values?: PrometheusValue[];
  value?: PrometheusValue;
};

export type PrometheusData = {
  resultType: 'matrix' | 'vector' | 'scalar' | 'string';
  result: PrometheusResult[];
};

export type PrometheusResponse = {
  status: string;
  data: PrometheusData;
  errorType?: string;
  error?: string;
  warnings?: string[];
};

export type WatchK8sResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  namespaced?: boolean;
  limit?: number;
  fieldSelector?: string;
  optional?: boolean;
};

export type ResourcesObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] };

export type WatchK8sResultsObject<R extends K8sResourceCommon | K8sResourceCommon[]> = {
  data: R;
  loaded: boolean;
  loadError: any;
};

export type WatchK8sResults<R extends ResourcesObject> = {
  [k in keyof R]: WatchK8sResultsObject<R[k]>;
};

export type WatchK8sResources<R extends ResourcesObject> = {
  [k in keyof R]: WatchK8sResource;
};

export type WatchK8sResourcesGeneric = {
  [key: string]: {
    model?: ExtensionK8sGroupKindModel;
    opts?: Partial<WatchK8sResource>;
  };
};

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

export type FirehoseResult<
  R extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceCommon[]
> = {
  loaded: boolean;
  loadError: string;
  optional?: boolean;
  data: R;
  kind?: string;
};

export type FirehoseResourcesResult = {
  [key: string]: FirehoseResult<K8sResourceCommon | K8sResourceCommon[]>;
};

export type WatchK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [R, boolean, any];

export type UseK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  initResource: WatchK8sResource | null,
) => WatchK8sResult<R>;

export type UseK8sWatchResources = <R extends ResourcesObject>(
  initResources: WatchK8sResources<R>,
) => WatchK8sResults<R>;

export type UseResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
) => [ResolvedExtension<E>[], boolean, any[]];

export type ConsoleFetch = (
  url: string,
  options?: RequestInit,
  timeout?: number,
) => Promise<Response>;

export type ConsoleFetchJSON<T = any> = {
  (url: string, method?: string, options?: RequestInit, timeout?: number): Promise<T>;
  delete(url: string, json?: any, options?: RequestInit, timeout?: number): Promise<T>;
  post(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
  put(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
  patch(url: string, json: any, options?: RequestInit, timeout?: number): Promise<T>;
};

export type ConsoleFetchText = (...args: Parameters<ConsoleFetch>) => Promise<string>;

/* Horizontal Nav Types */
export type NavPage = {
  href?: string;
  path?: string;
  name: string;
  component: React.ComponentType<RouteComponentProps>;
};

export type HorizontalNavProps = {
  resource?: K8sResourceCommon;
  pages: NavPage[];
};

export type QueryParams = {
  watch?: string;
  labelSelector?: string;
  fieldSelector?: string;
  resourceVersion?: string;
  [key: string]: string;
};

export type Options = {
  ns?: string;
  name?: string;
  path?: string;
  queryParams?: QueryParams;
};

export type Patch = {
  op: string;
  path: string;
  value?: any;
};

export enum K8sResourceConditionStatus {
  True = 'True',
  False = 'False',
  Unknown = 'Unknown',
}

export type K8sResourceCondition = {
  type: string;
  status: keyof typeof K8sResourceConditionStatus;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type CRDVersion = {
  name: string;
  served: boolean;
  storage: boolean;
  schema: {
    // NOTE: Actually a subset of JSONSchema, but using this type for convenience
    openAPIV3Schema: JSONSchema7;
  };
};

export type CustomResourceDefinitionKind = {
  spec: {
    group: string;
    versions: CRDVersion[];
    names: {
      kind: string;
      singular: string;
      plural: string;
      listKind: string;
      shortNames?: string[];
    };
    scope: 'Cluster' | 'Namespaced';
  };
  status?: {
    conditions?: K8sResourceCondition[];
  };
} & K8sResourceCommon;
