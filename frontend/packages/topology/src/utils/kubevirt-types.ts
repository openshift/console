import type { K8sResourceKind } from '@console/internal/module/k8s';

// HotplugVolumeStatus represents the hotplug status of the volume
export interface V1HotplugVolumeStatus {
  // AttachPodName is the name of the pod used to attach the volume to the node.
  attachPodName?: string;
  // AttachPodUID is the UID of the pod used to attach the volume to the node.
  attachPodUID?: string;
}

// VolumeStatus represents information about the status of volumes attached to the VirtualMachineInstance.
export interface V1VolumeStatus {
  // If the volume is hotplug, this will contain the hotplug status.
  hotplugVolume?: V1HotplugVolumeStatus;
  // Message is a detailed message about the current hotplug volume phase.
  message?: string;
  // Name is the name of the volume - Required.
  name: string;
  // phase of volume.
  phase?: string;
  // Reason is a brief description of why we are in the current hotplug volume phase
  reason?: string;
  // Target is the target name used when adding the volume to the VM, eg: vda - Required.
  target: string;
}

export type NodeSelector = {
  [key: string]: string;
};

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
