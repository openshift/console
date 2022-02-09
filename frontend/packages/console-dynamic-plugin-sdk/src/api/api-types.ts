import { K8sResourceCommon, K8sResourceKindReference, Selector } from '../extensions/console-types';

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
  partialMetadata?: boolean;
};

export type WatchK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [R, boolean, any];

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

export type UseK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  initResource: WatchK8sResource,
) => WatchK8sResult<R>;

export type UseK8sWatchResources = <R extends ResourcesObject>(
  initResources: WatchK8sResources<R>,
) => WatchK8sResults<R>;
