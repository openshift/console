import { PodKind, TemplateKind } from '@console/internal/module/k8s';
import { VMKind, V1NetworkInterface } from './vm';
import { V1Disk } from './vm/disk/V1Disk';

export type VMLikeEntityKind = VMKind | TemplateKind;

export type VMMultiStatus = {
  status: string;
  message?: string;
  pod?: PodKind;
  launcherPod?: PodKind;
  importerPodsStatuses?: any[];
  progress?: number;
};

export type BootableDeviceType = {
  type: string;
  typeLabel: string;
  value: V1Disk | V1NetworkInterface;
};
