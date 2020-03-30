import { K8sResourceKind } from '@console/internal/module/k8s';

export type WatchCephResource = {
  ceph: K8sResourceKind[];
};
