import { K8sResourceKind, ObjectMetadata, Affinity } from '@console/internal/module/k8s';
import { V1alpha1DataVolume } from './disk/V1alpha1DataVolume';

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancespec
export type VMISpec = {
  affinity: Affinity;
  dnsConfig: any;
  dnsPolicy: string;
  domain?: any;
  evictionStrategy: any;
  hostname: string;
  livenessProbe: any;
  networks?: any[];
  nodeSelector: NodeSelector;
  readinessProbe: any;
  subdomain: string;
  terminationGracePeriodSeconds: number;
  tolerations: any[];
  volumes?: any[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancestatus
export type VMIStatus = {
  conditions: any[];
  interfaces: any[];
  migrationMethod: string;
  migrationState: any;
  nodeName: string;
  phase: string;
  reason: string;
};

export type VMIKind = {
  spec: VMISpec;
  status: VMIStatus;
} & K8sResourceKind;

export type VMITemplate = {
  metadata?: ObjectMetadata;
  spec?: VMISpec;
};

export type VMSpec = {
  template: VMITemplate;
  running?: boolean;
  runStrategy?: any;
  dataVolumeTemplates?: V1alpha1DataVolume[];
};

export type VMStatus = {
  conditions?: any[];
  created?: boolean;
  ready?: boolean;
  stateChangeRequests?: any[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachine
export type VMKind = {
  spec: VMSpec;
  status: VMStatus;
} & K8sResourceKind;

export type CPU = {
  sockets: number;
  cores: number;
  threads: number;
  dedicatedCpuPlacement?: boolean;
};

export type CPURaw = {
  sockets: string;
  cores: string;
  threads: string;
};

export type V1NetworkInterface = {
  name?: string;
  model?: string;
  macAddress?: string;
  bootOrder?: number;
  bridge?: {};
  masquerade?: {};
  sriov?: {};
  slirp?: {};
};

export type V1Network = {
  name?: string;
  multus?: {
    networkName: string;
  };
  pod?: {};
  genie?: {};
};

export type NodeSelector = {
  [key: string]: string;
};
