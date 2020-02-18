import { ObjectMetadata, K8sResourceKind } from '@console/internal/module/k8s';

export type NodeTableRow = {
  cells: any[];
  selected: boolean;
  id: string;
  metadata: ObjectMetadata;
  spec: Pick<K8sResourceKind, 'spec'>;
  cpuCapacity: string;
  allocatableMemory: string;
};

export enum FilterMode {
  NAME = 'Name',
  LABEL = 'Label',
}
