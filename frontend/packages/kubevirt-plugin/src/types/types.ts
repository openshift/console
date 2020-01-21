import { PodKind, TemplateKind } from '@console/internal/module/k8s';
import { DeviceType } from '../constants';
import { VMKind, V1NetworkInterface, VMIKind } from './vm';
import { V1Disk } from './vm/disk/V1Disk';

export type VMILikeEntityKind = VMKind | VMIKind;
export type VMLikeEntityKind = VMKind | TemplateKind;
export type VMGenericLikeEntityKind = VMLikeEntityKind | VMILikeEntityKind;

export type VMMultiStatus = {
  status: string;
  message?: string;
  pod?: PodKind;
  launcherPod?: PodKind;
  importerPodsStatuses?: any[];
  progress?: number;
};

export type BootableDeviceType = {
  type: DeviceType;
  typeLabel: string;
  value: V1Disk | V1NetworkInterface;
};
