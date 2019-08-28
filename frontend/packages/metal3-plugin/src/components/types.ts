import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';

export type HostRowBundle = {
  metadata?: { name: string };
  machine: MachineKind;
  node: NodeKind;
  host: K8sResourceKind;
  nodeMaintenance: K8sResourceKind;
  status: HostMultiStatus;
};

export type HostMultiStatus = {
  status: string;
  title: string;
  [key: string]: any;
};
