import { SubsystemHealth } from '@console/dynamic-plugin-sdk';
import { ConfigMap } from '../resources';

export type ConnectionFormFormikValues = {
  vcenter: string;
  username: string;
  password: string;
  datacenter: string;
  defaultDatastore: string;
  folder: string;
  vCenterCluster: string;
};

export type VSphereConnectionProps = {
  hide: () => void;
  cloudProviderConfig?: ConfigMap;
  health: SubsystemHealth;
};
