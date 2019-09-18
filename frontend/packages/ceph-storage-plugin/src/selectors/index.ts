import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils';
import { OCS_OPERATOR } from '../constants';

const cephStorageProvisioners = ['ceph.rook.io/block', 'cephfs.csi.ceph.com', 'rbd.csi.ceph.com'];
const cephStorageLabel = 'cluster.ocs.openshift.io/openshift-storage';

export const filterCephAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'ceph');

export const getCephPVCs = (
  cephSCNames: string[] = [],
  pvcsData: K8sResourceKind[] = [],
): K8sResourceKind[] =>
  pvcsData.filter((pvc) => cephSCNames.includes(_.get(pvc, 'spec.storageClassName')));

export const getCephPVs = (pvsData: K8sResourceKind[] = []): K8sResourceKind[] =>
  pvsData.filter((pv) => {
    return cephStorageProvisioners.some((provisioner: string) =>
      _.get(pv, 'metadata.annotations["pv.kubernetes.io/provisioned-by"]', '').includes(
        provisioner,
      ),
    );
  });

export const getCephNodes = (nodesData: K8sResourceKind[] = []): K8sResourceKind[] =>
  nodesData.filter((node) => _.keys(_.get(node, 'metadata.labels')).includes(cephStorageLabel));

export const getCephSC = (scData: K8sResourceKind[]): K8sResourceKind[] =>
  scData.filter((sc) => {
    return cephStorageProvisioners.some((provisioner: string) =>
      _.get(sc, 'provisioner', '').includes(provisioner),
    );
  });

export const getOCSVersion = (items: FirehoseResult): string => {
  const itemsData: K8sResourceKind[] = _.get(items, 'data');
  const operator: K8sResourceKind = _.find(
    itemsData,
    (item) => _.get(item, 'spec.name') === OCS_OPERATOR,
  );
  return _.get(operator, 'status.currentCSV');
};
