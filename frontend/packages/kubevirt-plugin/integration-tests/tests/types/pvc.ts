export type PVCData = {
  image: string;
  os?: string;
  pvcName?: string;
  pvcSize: string;
  pvcSizeUnits: string;
  storageClass: string;
  accessMode?: string;
};
