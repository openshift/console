import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../types';

export type HostRowBundle = {
  metadata?: { name: string };
  machine: MachineKind;
  node: NodeKind;
  host: BareMetalHostKind;
  nodeMaintenance: K8sResourceKind;
  status: HostMultiStatus;
};

export type HostMultiStatus = {
  status: string;
  title: string;
  [key: string]: any;
};
