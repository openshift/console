import { Action } from '@console/dynamic-plugin-sdk';
import { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';

export type ResourceActionCreator<T extends K8sResourceKind = K8sResourceKind> = (
  kind: K8sModel,
  obj: T,
  relatedResource?: T,
  message?: JSX.Element,
) => Action;

export type ResourceActionFactory = Record<string, ResourceActionCreator>;
