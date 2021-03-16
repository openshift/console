import { V1NetworkInterface } from '.';
import { V1Disk } from '../api';

export type Devices = {
  disks?: V1Disk[];
  interfaces?: V1NetworkInterface[];
};
