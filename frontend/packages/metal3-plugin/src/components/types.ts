import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../types';

export type StatusProps = {
  status: string;
  title?: string;
  description?: string;
  [key: string]: any;
};

export type BareMetalHostBundle = {
  metadata?: { name: string };
  machine: MachineKind;
  node: NodeKind;
  host: BareMetalHostKind;
  nodeMaintenance: K8sResourceKind;
  status: StatusProps;
};

export type BareMetalNodeBundle = {
  metadata?: { name: string };
  node: NodeKind;
  machine: MachineKind;
  host: BareMetalHostKind;
  nodeMaintenance: K8sResourceKind;
  // TODO(jtomasek): replace with new BareMetalNodeStatus
  status: StatusProps;
};
