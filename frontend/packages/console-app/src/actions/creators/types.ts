import type { ReactNode } from 'react';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';

type ResourceActionCreator = (
  kind: K8sModel,
  obj: K8sResourceKind,
  relatedResource?: K8sResourceKind,
  message?: ReactNode,
) => Action;

export type ResourceActionFactory = Record<string, ResourceActionCreator>;
