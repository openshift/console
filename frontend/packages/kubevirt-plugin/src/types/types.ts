import { DeviceType } from '../constants';
import { V1Disk } from './api';
import { V1NetworkInterface } from './vm';

export type BootableDeviceType = {
  type: DeviceType;
  typeLabel: string;
  value: V1Disk | V1NetworkInterface;
};

export type IDEntity = {
  id: number;
};

export type OperatingSystemRecord = {
  id: string;
  name: string;
  baseImageName?: string;
  baseImageNamespace?: string;
  baseImageRecomendedSize?: any;
};
