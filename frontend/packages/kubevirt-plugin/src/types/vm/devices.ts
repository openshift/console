import { V1Disk } from '../api';
import { V1NetworkInterface } from '.';

export type Devices = {
  disks?: V1Disk[];
  interfaces?: V1NetworkInterface[];
};
