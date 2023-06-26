import { SubsystemHealth } from '@console/dynamic-plugin-sdk';
import { ConfigMap } from '../resources';

export type ConnectionFormContextSetters = {
  setVcenter: (v: string) => void;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  setDatacenter: (v: string) => void;
  setDefaultDatastore: (v: string) => void;
  setFolder: (v: string) => void;
  setVCenterCluster: (v: string) => void;
};

export type ConnectionFormContextValues = {
  vcenter: string;
  username: string;
  password: string;
  datacenter: string;
  defaultDatastore: string;
  folder: string;
  vCenterCluster: string;
};

export type ConnectionFormContextData = {
  values: ConnectionFormContextValues;
  setters: ConnectionFormContextSetters;
  isDirty: boolean;
  setDirty: (v: boolean) => void;
  isValid: boolean;
};

export type VSphereConnectionProps = {
  hide: () => void;
  cloudProviderConfig?: ConfigMap;
  health: SubsystemHealth;
};
