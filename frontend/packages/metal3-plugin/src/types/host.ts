export type BareMetalHostNIC = {
  ip: string;
  mac: string;
  model: string;
  name: string;
  pxe: boolean;
  speedGbps: number;
  vlanId: number;
};

export type BareMetalHostDisk = {
  hctl: string;
  model: string;
  name: string;
  rotational: boolean;
  serialNumber: string;
  sizeBytes: number;
  vendor: string;
};

export type BareMetalHostCPU = {
  arch: string;
  clockMegahertz: number;
  count: number;
  flags: string[];
  model: string;
};

export type BareMetalHostSystemVendor = {
  manufacturer: string;
  productName: string;
  serialNumber: string;
};

export type BareMetalHostBios = {
  date: string;
  vendor: string;
  version: string;
};
