import { V1CDRomTarget } from '../../../types/vm/disk/V1CDRomTarget';

export type CD = {
  name: string;
  bootOrder?: number;
  cdrom?: V1CDRomTarget;

  // UI
  changed?: boolean;
  newCD?: boolean;
  pvc?: string;
  container?: string;
  type?: string;
  bus?: string;
  url?: string;
  windowsTools?: string;
  storageClass?: string;
  size?: string | number;
  isURLValid?: boolean;
};

export type CDMap = {
  [name: string]: CD;
};
