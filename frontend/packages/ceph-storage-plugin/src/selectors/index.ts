import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';
import { K8sResourceKind } from '@console/internal/module/k8s';

const cephStorageProvisioners = ['ceph.rook.io/block', 'cephfs.csi.ceph.com', 'rbd.csi.ceph.com'];
const cephStorageLabel = 'cluster.ocs.openshift.io/openshift-storage';

export const filterCephAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'ceph');

export const getCephPVCs = (pvcsData: K8sResourceKind[] = []): K8sResourceKind[] =>
  pvcsData.filter((pvc) =>
    cephStorageProvisioners.includes(
      _.get(pvc, 'metadata.annotations["volume.beta.kubernetes.io/storage-provisioner"]'),
    ),
  );

export const getCephPVs = (pvsData: K8sResourceKind[] = []): K8sResourceKind[] =>
  pvsData.filter((pv) =>
    cephStorageProvisioners.includes(
      _.get(pv, 'metadata.annotations["pv.kubernetes.io/provisioned-by"]'),
    ),
  );

export const getCephNodes = (nodesData: K8sResourceKind[] = []): K8sResourceKind[] =>
  nodesData.filter((node) => _.keys(_.get(node, 'metadata.labels')).includes(cephStorageLabel));
