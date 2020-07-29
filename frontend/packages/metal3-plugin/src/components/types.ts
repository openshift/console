import {
  K8sResourceKind,
  MachineKind,
  MachineSetKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../types';

export type StatusProps = {
  status: string;
  title?: string;
  description?: string;
};

export type BareMetalHostStatusProps = StatusProps & {
  nodeMaintenance?: K8sResourceKind;
  csr: CertificateSigningRequestKind;
  className?: string;
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

export type CSRBundle = {
  name: string;
  status: StatusProps;
  csr: CertificateSigningRequestKind;
};

export type BareMetalNodeBundle = {
  name: string;
  node: NodeKind;
  machine: MachineKind;
  host: BareMetalHostKind;
  nodeMaintenance: K8sResourceKind;
  csr: CertificateSigningRequestKind;
  // TODO(jtomasek): replace with new BareMetalNodeStatus
  status: StatusProps;
};

export type BareMetalNodeListBundle = CSRBundle | BareMetalNodeBundle;

export const isCSRBundle = (bundle: BareMetalNodeListBundle): bundle is CSRBundle =>
  !('node' in bundle);

export type BareMetalNodeDetailsPageProps = {
  obj: NodeKind;
  hosts: BareMetalHostKind[];
  nodeMaintenances: K8sResourceKind[];
  csrs: CertificateSigningRequestKind[];
};
