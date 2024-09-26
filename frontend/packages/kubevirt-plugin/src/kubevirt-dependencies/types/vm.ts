import { K8sResourceKind } from '@console/internal/module/k8s';
import { V1alpha1DataVolumeSpec, V1alpha1DataVolumeStatus, V1Disk, V1ObjectMeta } from './api';
import { VMITemplate } from './vmi';

// https://kubevirt.io/api-reference/v0.38.1/definitions.html#_v1_datavolumetemplatespec
export interface V1DataVolumeTemplateSpec {
  metadata?: V1ObjectMeta;
  spec: V1alpha1DataVolumeSpec;
  status?: V1alpha1DataVolumeStatus;
}

export type VMSpec = {
  template: VMITemplate;
  running?: boolean;
  runStrategy?: string;
  dataVolumeTemplates?: V1DataVolumeTemplateSpec[];
};

export type VMStatus = {
  conditions?: any[];
  created?: boolean;
  ready?: boolean;
  printableStatus?: string;
  stateChangeRequests?: VMStatusStateChangeRequest[];
};

export type VMStatusStateChangeRequest = {
  action: string;
  uid: string;
  data: { [key: string]: string };
};

// https://kubevirt.io/api-reference/v0.38.1/definitions.html#_v1_virtualmachine
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

export type Devices = {
  disks?: V1Disk[];
  interfaces?: V1NetworkInterface[];
};

export type DataSourceKind = {
  spec: { source: { pvc: { name: string; namespace: string } } };
} & K8sResourceKind;

export type VMSnapshot = {
  spec: {
    source: {
      apiGroup: string;
      kind: string;
      name: string;
    };
  };
} & K8sResourceKind;
