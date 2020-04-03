import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils';
import { getSubscriptionStatus } from '@console/operator-lifecycle-manager/src/status/csv-status';
import { SubscriptionState, SubscriptionKind } from '@console/operator-lifecycle-manager';
import { cephStorageProvisioners } from '@console/shared/src/utils';
import { OCS_OPERATOR } from '../constants';

export const cephStorageLabel = 'cluster.ocs.openshift.io/openshift-storage';

export const filterCephAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'ceph');

export const getCephPVs = (pvsData: K8sResourceKind[] = []): K8sResourceKind[] =>
  pvsData.filter((pv) => {
    return cephStorageProvisioners.some((provisioner: string) =>
      _.get(pv, 'metadata.annotations["pv.kubernetes.io/provisioned-by"]', '').includes(
        provisioner,
      ),
    );
  });

const getPVStorageClass = (pv: K8sResourceKind) => _.get(pv, 'spec.storageClassName');
const getStorageClassName = (pvc: K8sResourceKind) =>
  _.get(pvc, ['metadata', 'annotations', 'volume.beta.kubernetes.io/storage-class']) ||
  _.get(pvc, 'spec.storageClassName');
const isBound = (pvc: K8sResourceKind) => _.get(pvc, 'status.phase') === 'Bound';

export const getCephPVCs = (
  cephSCNames: string[] = [],
  pvcsData: K8sResourceKind[] = [],
  pvsData: K8sResourceKind[] = [],
): K8sResourceKind[] => {
  const cephPVs = getCephPVs(pvsData);
  const cephSCNameSet = new Set<string>([...cephSCNames, ...cephPVs.map(getPVStorageClass)]);
  const cephBoundPVCUIDSet = new Set<string>(_.map(cephPVs, 'spec.claimRef.uid'));
  // If the PVC is bound use claim uid(links PVC to PV) else storage class to verify it's provisioned by ceph.
  return pvcsData.filter((pvc: K8sResourceKind) =>
    isBound(pvc)
      ? cephBoundPVCUIDSet.has(pvc.metadata.uid)
      : cephSCNameSet.has(getStorageClassName(pvc)),
  );
};

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
  if (
    getSubscriptionStatus(operator as SubscriptionKind).status ===
    SubscriptionState.SubscriptionStateAtLatest
  ) {
    return _.get(operator, 'status.currentCSV');
  }
  return '';
};
