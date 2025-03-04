// https://kubevirt.io/api-reference/v0.38.1/definitions.html#_v1_virtualmachineinstancespec
import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';
import { V1VolumeStatus } from './volumes/V1VolumeStatus';

export type NodeSelector = {
  [key: string]: string;
};

export type VMITemplate = {
  metadata?: ObjectMetadata;
  spec?: VMISpec;
};

export type VMISpec = {
  affinity: any;
  dnsConfig: any;
  dnsPolicy: string;
  domain?: any;
  evictionStrategy?: string;
  hostname: string;
  livenessProbe: any;
  networks?: any[];
  nodeSelector: NodeSelector;
  readinessProbe: any;
  subdomain: string;
  terminationGracePeriodSeconds: number;
  tolerations: any[];
  volumes?: any[];
  accessCredentials?: any;
};

// https://kubevirt.io/api-reference/v0.38.1/definitions.html#_v1_virtualmachineinstancestatus
export type VMIStatus = {
  conditions: any[];
  interfaces: any[];
  migrationMethod: string;
  migrationState: any;
  nodeName: string;
  phase: string;
  reason: string;
  volumeStatus?: V1VolumeStatus[];
};

export type VMIKind = {
  spec: VMISpec;
  status: VMIStatus;
} & K8sResourceKind;
