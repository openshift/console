import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancespec
export type VmiSpec = {
  affinity: any;
  dnsConfig: any;
  dnsPolicy: string;
  domain?: any;
  evictionStrategy: any;
  hostname: string;
  livenessProbe: any;
  networks?: any[];
  nodeSelector: any;
  readinessProbe: any;
  subdomain: string;
  terminationGracePeriodSeconds: number;
  tolerations: any[];
  volumes?: any[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancestatus
export type VmiStatus = {
  conditions: any[];
  interfaces: any[];
  migrationMethod: string;
  migrationState: any;
  nodeName: string;
  phase: string;
  reason: string;
};

export type VmiKind = {
  spec: VmiSpec;
  status: VmiStatus;
} & K8sResourceKind;

export type VmiTemplate = {
  metadata?: ObjectMetadata;
  spec?: VmiSpec;
};

export type VmSpec = {
  template: VmiTemplate;
  running?: boolean;
  runStrategy?: any;
  dataVolumeTemplates?: any[];
};

export type VmStatus = {
  conditions?: any[];
  created?: boolean;
  ready?: boolean;
  stateChangeRequests?: any[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachine
export type VmKind = {
  spec: VmSpec;
  status: VmStatus;
} & K8sResourceKind;
