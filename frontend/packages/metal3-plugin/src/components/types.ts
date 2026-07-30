import type {
  K8sResourceKind,
  MachineKind,
  MachineSetKind,
  NodeKind,
} from '@console/internal/module/k8s';
import type { BareMetalHostKind } from '../types/host';

export type StatusProps = {
  status: string;
  titleKey?: string;
  descriptionKey?: string;
};

export type BareMetalHostBundle = {
  metadata?: { name: string };
  machine?: MachineKind;
  machineSet?: MachineSetKind;
  node: NodeKind;
  host: BareMetalHostKind;
  nodeMaintenance: K8sResourceKind;
  status: StatusProps;
};
