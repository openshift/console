import {
  K8sResourceCondition,
  K8sResourceKind,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import { V1alpha1DataVolumeSpec, V1alpha1DataVolumeStatus, V1ObjectMeta } from '../api';
import { V1VirtualMachineInstanceGuestOSInfo } from '../vmi-guest-data-info/vmi-guest-agent-info';

// https://kubevirt.io/api-reference/master/definitions.html#_v1_datavolumetemplatespec
export interface V1DataVolumeTemplateSpec {
  apiVersion?: string;
  metadata?: V1ObjectMeta;
  spec: V1alpha1DataVolumeSpec;
  status?: V1alpha1DataVolumeStatus;
}

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancespec
export type VMISpec = {
  accessCredentials?: any;
  affinity?: any;
  dnsConfig?: any;
  dnsPolicy?: string;
  domain: any;
  evictionStrategy?: string;
  hostname?: string;
  livenessProbe?: any;
  networks?: any[];
  nodeSelector?: NodeSelector;
  priorityClassName?: string;
  readinessProbe?: any;
  schedulerName?: string;
  subdomain?: string;
  terminationGracePeriodSeconds?: number;
  tolerations?: any[];
  volumes?: any[];
};

// https://kubevirt.io/api-reference/master/definitions.html#_v1_virtualmachineinstancestatus
export type VMIStatus = {
  activePods?: { [key: string]: string };
  conditions?: any[];
  evacuationNodeName?: string;
  guestOSInfo?: V1VirtualMachineInstanceGuestOSInfo;
  interfaces?: any[];
  migrationMethod?: string;
  migrationState?: any;
  nodeName?: string;
  phase?: string;
  qosClass?: string;
  reason?: string;
  volumeStatus?: any;
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
  stateChangeRequests?: VMStatusStateChangeRequest[];
};

export type VMStatusStateChangeRequest = {
  action: string;
  uid: string;
  data: { [key: string]: string };
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
