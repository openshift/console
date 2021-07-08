import { TFunction } from 'i18next';
import {
  HealthState,
  K8sResourceCommon,
  PrometheusResponse,
  ResourcesObject,
  WatchK8sResults,
  FirehoseResourcesResult,
  FirehoseResult,
} from './console-types';

export type DashboardCardSpan = 4 | 6 | 12;

export type GetOperatorsWithStatuses<R extends K8sResourceCommon = K8sResourceCommon> = (
  resources: FirehoseResourcesResult,
) => OperatorStatusWithResources<R>[];

export type K8sActivityProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  resource: R;
};

export type OperatorRowProps<R extends K8sResourceCommon = K8sResourceCommon> = {
  operatorStatus: OperatorStatusWithResources<R>;
};

export type OperatorStatusWithResources<R extends K8sResourceCommon = K8sResourceCommon> = {
  operators: R[];
  status: OperatorStatusPriority;
};

export type OperatorStatusPriority = {
  title: string;
  priority: number;
  icon: React.ReactNode;
  health: keyof typeof HealthState;
};

export type PrometheusHealthHandler = (
  responses: { response: PrometheusResponse; error: any }[],
  t?: TFunction,
  additionalResource?: FirehoseResult<K8sResourceCommon | K8sResourceCommon[]>,
) => SubsystemHealth;

export type PrometheusHealthPopupProps = {
  responses: { response: PrometheusResponse; error: any }[];
  k8sResult?: FirehoseResult<K8sResourceCommon | K8sResourceCommon[]>;
};

export type PrometheusActivityProps = {
  results: PrometheusResponse[];
};

export type ResourceHealthHandler<R extends ResourcesObject> = (
  resourcesResult: WatchK8sResults<R>,
  t?: TFunction,
) => SubsystemHealth;

export type SubsystemHealth = {
  message?: string;
  state: HealthState;
};

export type URLHealthHandler<
  R,
  T extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceCommon | K8sResourceCommon[]
> = (response: R, error: any, additionalResource?: FirehoseResult<T>) => SubsystemHealth;
