import { K8sResourceCondition } from '@console/dynamic-plugin-sdk/src/api/k8s-types';
import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';
import {
  V1alpha1DataVolumeSpec,
  V1alpha1DataVolumeStatus,
  V1ObjectMeta,
  V1VolumeStatus,
} from '../api';

// https://kubevirt.io/api-reference/v0.38.1/definitions.html#_v1_datavolumetemplatespec
export interface V1DataVolumeTemplateSpec {
  metadata?: V1ObjectMeta;
  spec: V1alpha1DataVolumeSpec;
  status?: V1alpha1DataVolumeStatus;
}

// https://kubevirt.io/api-reference/v0.38.1/definitions.html#_v1_virtualmachineinstancespec
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

export type VMITemplate = {
  metadata?: ObjectMetadata;
  spec?: VMISpec;
};

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

export type NodeSelector = {
  [key: string]: string;
};

export type VMSnapshot = {
  spec: {
    source: {
      apiGroup: string;
      kind: string;
      name: string;
    };
  };
} & K8sResourceKind;

export type VMRestore = {
  spec: {
    target: {
      apiGroup: string;
      kind: string;
      name: string;
    };
    virtualMachineSnapshotName: string;
    includeVolumes: string[];
    excludeVolumes: string[];
  };
  status: {
    complete: boolean;
    conditions: K8sResourceCondition[];
    restoreTime: string;
  };
} & K8sResourceKind;

export type StorageProfile = {
  spec: any;
  status: {
    claimPropertySets?: [
      {
        accessModes?: string[];
        volumeMode?: string;
      },
    ];
    provisioner: string;
    storageClass: string;
  };
} & K8sResourceKind;

export type DataSourceKind = {
  spec: { source: { pvc: { name: string; namespace: string } } };
} & K8sResourceKind;
