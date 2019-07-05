export type BaremetalHostNIC = {
  ip: string;
  mac: string;
  model: string;
  name: string;
  pxe: boolean;
  speedGbps: number;
  vlanId: number;
};

export type BaremetalHostDisk = {
  hctl: string;
  model: string;
  name: string;
  rotational: boolean;
  serialNumber: string;
  sizeBytes: number;
  vendor: string;
};
