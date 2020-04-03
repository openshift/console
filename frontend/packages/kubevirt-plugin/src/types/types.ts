import { PodKind } from '@console/internal/module/k8s';
import { DeviceType } from '../constants';
import { V1NetworkInterface } from './vm';
import { V1Disk } from './vm/disk/V1Disk';

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

export type IDEntity = {
  id: number;
};
