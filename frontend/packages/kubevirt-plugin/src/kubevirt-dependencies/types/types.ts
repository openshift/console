import { DeviceType } from '../constants/vm/constants';
import { V1Disk } from './api';
import { V1NetworkInterface } from './vm';

export type BootableDeviceType = {
  type: DeviceType;
  typeLabel: string;
  value: V1Disk | V1NetworkInterface;
};
