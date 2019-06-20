import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancespec
export type VMISpec = {
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
  dataVolumeTemplates?: any[];
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
