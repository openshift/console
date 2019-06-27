import { PodKind, TemplateKind } from '@console/internal/module/k8s';
import { VMKind } from './vm';

export type VMLikeEntityKind = VMKind | TemplateKind;

export type K8sEntityMap<A> = { [propertyName: string]: A };

export type Patch = {
  op: string;
  path: string;
  value?: any;
};

export type VMMultiStatus = {
  status: string;
  message?: string;
  pod?: PodKind;
  launcherPod?: PodKind;
  importerPodsStatuses?: any[];
  progress?: number;
};
