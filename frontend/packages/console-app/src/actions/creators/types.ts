import type { Action } from '@console/dynamic-plugin-sdk';
import type { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';

export type ResourceActionCreator = (
  kind: K8sModel,
  obj: K8sResourceKind,
  relatedResource?: K8sResourceKind,
  message?: JSX.Element,
) => Action;

export type ResourceActionFactory = Record<string, ResourceActionCreator>;
