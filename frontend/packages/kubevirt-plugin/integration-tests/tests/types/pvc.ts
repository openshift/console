export type PVCData = {
  namespace?: string;
  image: string;
  os?: string;
  pvcName?: string;
  pvcSize: string;
  pvcSizeUnits?: string;
  storageClass: string;
  accessMode?: string;
  volumeMode?: string;
};
