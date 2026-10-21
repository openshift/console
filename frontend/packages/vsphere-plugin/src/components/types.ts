import type { QueryParams, SubsystemHealth } from '@console/dynamic-plugin-sdk';
import type { ConfigMap } from '../resources';

export type ConnectionFormFormikValues = {
  vcenter: string;
  username: string;
  password: string;
  datacenter: string;
  defaultDatastore: string;
  folder: string;
  vCenterCluster: string;
  network: string; // Primary network name
  isInit?: boolean;
};

export type VSphereConnectionProps = {
  hide: () => void;
  cloudProviderConfig?: ConfigMap;
  health: SubsystemHealth;
};

export type ProviderCM = {
  global?: {
    user: string;
    password: string;
    server: string;
    port: number;
    insecureFlag: boolean;
    datacenters: string[];
    soapRoundtripCount: number;
    caFile: string;
    thumbprint: string;
    secretName: string;
    secretNamespace: string;
    secretsDirectory: string;
    apiDisable: boolean;
    apiBinding: string;
    ipFamily: string[];
  };
  vcenter: {
    [key: string]: {
      user: string;
      password: string;
      tenantref: string;
      server: string;
      datacenters: string[];
      port: number;
      insecureFlag: boolean;
      soapRoundtripCount: number;
      caFile: string;
      thumbprint: string;
      secretref: string;
      secretName: string;
      secretNamespace: string;
      ipFamily: string[];
    };
  };
  labels: {
    zone: string;
    region: string;
  };
};

export type PersistOp = (queryParams?: QueryParams) => Promise<any>;
