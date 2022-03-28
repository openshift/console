import {
  K8sGroupVersionKind,
  K8sResourceCommon,
  Patch,
  QueryParams,
  Status,
} from '../extensions/console-types';
import { K8sModel } from './common-types';

// K8s CRUD utility types to be exposed by dynamic plugin SDK.
export type K8sGet = <R extends K8sResourceCommon>(options: {
  model: K8sModel;
  name: string;
  ns?: string;
  path?: string;
  queryParams?: QueryParams;
  requestInit?: RequestInit;
}) => Promise<R>;

export type K8sCreate = <R extends K8sResourceCommon>(options: {
  model: K8sModel;
  data: R;
  path?: string;
  queryParams?: QueryParams;
}) => Promise<R>;

export type K8sUpdate = <R extends K8sResourceCommon>(options: {
  model: K8sModel;
  data: R;
  path?: string;
  queryParams?: QueryParams;
}) => Promise<R>;

export type K8sPatch = <R extends K8sResourceCommon>(options: {
  model: K8sModel;
  resource: R;
  data: Patch[];
  path?: string;
  queryParams?: QueryParams;
}) => Promise<R>;

export type K8sDelete = <R extends K8sResourceCommon>(options: {
  model: K8sModel;
  resource: R;
  path?: string;
  queryParams?: QueryParams;
  requestInit?: RequestInit;
  json?: Record<string, any>;
}) => Promise<Status>;

export type K8sList = <R extends K8sResourceCommon>(options: {
  model: K8sModel;
  queryParams: { [key: string]: any };
  requestInit?: RequestInit;
}) => Promise<R[]>;

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

export type Options = {
  ns?: string;
  name?: string;
  path?: string;
  queryParams?: QueryParams;
  cluster?: string;
};

export type GetK8sResourcePath = (model: K8sModel, options: Options) => string;

export type GetAPIVersionForModel = (model: K8sModel) => string;

export type GetGroupVersionKindForResource = (resource: K8sResourceCommon) => K8sGroupVersionKind;

export type GetGroupVersionKindForModel = (model: K8sModel) => K8sGroupVersionKind;
