import {
  K8sResourceCommon,
  CustomResourceDefinitionKind,
  Selector,
  OwnerReference,
  Options,
  Patch,
} from '../extensions/console-types';
import { K8sKind, ExtensionK8sGroupModel } from './common-types';

// TODO - Convert WS factory to typescript and remove this temporary type
type WSFactory = (id: any, options: any) => void;

/**
 * K8s CRUD utility types to be exposed by dynamic plugin SDK.
 *  */

export type K8sGet = (
  kind: K8sKind,
  name: string,
  ns?: string,
  opts?: Options,
  requestInit?: RequestInit,
) => Promise<any>;

export type K8sCreate = <R extends K8sResourceCommon>(
  kind: K8sKind,
  data: R,
  opts?: Options,
) => Promise<any>;

export type K8sUpdate = <R extends K8sResourceCommon>(
  kind: K8sKind,
  data: R,
  ns?: string,
  name?: string,
  opts?: Options,
) => Promise<R>;

export type K8sPatch = <R extends K8sResourceCommon>(
  kind: K8sKind,
  resource: R,
  data: Patch[],
  opts?: Options,
) => Promise<any>;

export type K8sPatchByName = (
  kind: K8sKind,
  name: string,
  namespace: string,
  data: Patch[],
  opts?: Options,
) => Promise<any>;

export type K8sKill = <R extends K8sResourceCommon>(
  kind: K8sKind,
  resource: R,
  opts?: Options,
  requestInit?: RequestInit,
  json?: Record<string, any>,
) => Promise<any>;

export type K8sKillByName = <R extends K8sResourceCommon>(
  kind: K8sKind,
  name: string,
  namespace?: string,
  opts?: Options,
  requestInit?: RequestInit,
) => Promise<R>;

export type K8sList = (
  kind: K8sKind,
  params?: {
    [key: string]: any;
  },
  raw?: boolean,
  requestInit?: RequestInit,
) => Promise<any>;

export type K8sListPartialMetadata = (
  kind: K8sKind,
  params?: {
    [key: string]: any;
  },
  raw?: boolean,
) => Promise<any>;

export type K8sWatch = (
  kind: K8sKind,
  query?: {
    labelSelector?: Selector;
    resourceVersion?: string;
    ns?: string;
    fieldSelector?: string;
  },
  wsOptions?: {
    [key: string]: any;
  },
) => WSFactory;

export type K8sWaitForUpdate = <R extends K8sResourceCommon>(
  kind: K8sKind,
  resource: R,
  checkCondition: (kind: R) => boolean,
  timeoutInMs: number,
) => Promise<unknown>;

/**
 * K8s reference utility types to be exposed by dynamic plugin SDK.
 *  */

export type GetGroupVersionKind = (ref: string) => [string, string, string];

export type IsGroupVersionKind = (ref: string) => boolean;

export type GroupVersionFor = (
  apiVersion: string,
) => {
  group: string;
  version: string;
};

export type ApiVersionCompare = (v1: string, v2: string) => number;

export type GetLatestVersionForCRD = (crd: CustomResourceDefinitionKind) => string;

export type ReferenceForCRD = (obj: CustomResourceDefinitionKind) => string;

export type ReferenceForOwnerRef = (ownerRef: OwnerReference) => string;

export type ReferenceForExtensionModel = (model: ExtensionK8sGroupModel) => string;

export type ReferenceFor = ({ kind, apiVersion }: K8sResourceCommon) => string;

export type KindForReference = (ref: string) => string;

export type ApiGroupForReference = (ref: string) => string;

export type VersionForReference = (ref: string) => string;

export type ApiVersionForReference = (ref: string) => string;

export type NameForModel = (model: K8sKind) => string;

export type ReferenceForGroupVersionKind = (
  group: string,
) => (version: string) => (kind: string) => string;

export type ReferenceForModel = (model: K8sKind) => string;

export type ApiVersionForModel = (model: K8sKind) => string;
