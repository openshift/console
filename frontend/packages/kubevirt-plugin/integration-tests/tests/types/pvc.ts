import { OperatingSystem } from '../utils/constants/wizard';

export type PVCData = {
  namespace?: string;
  image: string;
  os?: OperatingSystem;
  pvcName?: string;
  pvcSize: string;
  pvcSizeUnits?: string;
  storageClass: string;
  accessMode?: string;
  volumeMode?: string;
};
