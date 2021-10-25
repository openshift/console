import {
  K8sResourceKindReference,
  K8sGroupVersionKind,
  K8sResourceCommon,
  Patch,
  QueryParams,
  Status,
} from '../extensions/console-types';
import { K8sModel } from './common-types';
import { Options } from './internal-types';

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

export type GetK8sResourcePath = (model: K8sModel, options: Options) => string;

export type GetReference = (K8sGroupVersionKind: K8sGroupVersionKind) => K8sResourceKindReference;

export type GetReferenceForModel = (model: K8sModel) => K8sResourceKindReference;

export type GetAPIVersionForModel = (model: K8sModel) => string;

export type GetGroupVersionKindForResource = (resource: K8sResourceCommon) => K8sGroupVersionKind;

export type GetGroupVersionKindForReference = (
  reference: K8sResourceKindReference,
) => K8sGroupVersionKind;
