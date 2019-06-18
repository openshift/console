export type provisionOption = {
  method: string,
  source?: string,
};

export type networkResource = {
  name: string,
  mac: string,
  binding: string,
  networkDefinition: string,
};

export type storageResource = {
  name: string,
  size: string,
  storageClass: string,
  attached?: boolean,
};

export type cloudInitConfig = {
  useCloudInit: boolean,
  useCustomScript?: boolean,
  customScript?: string,
  hostname?: string,
  sshKey?: string,
};
