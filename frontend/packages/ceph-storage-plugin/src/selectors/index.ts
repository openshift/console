import * as _ from 'lodash';
import { Alert } from '@console/internal/components/monitoring/types';
import { K8sResourceKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import { FirehoseResult, convertToBaseValue } from '@console/internal/components/utils';
import { cephStorageProvisioners } from '@console/shared/src/utils';
import { OCS_OPERATOR, ODF_OPERATOR } from '../constants';

export const cephStorageLabel = 'cluster.ocs.openshift.io/openshift-storage';

const enum status {
  BOUND = 'Bound',
  AVAILABLE = 'Available',
}
export const filterCephAlerts = (alerts: Alert[]): Alert[] => {
  const rookRegex = /.*rook.*/;
  return alerts?.filter(
    (alert) =>
      alert?.annotations?.storage_type === 'ceph' ||
      Object.values(alert?.labels)?.some((item) => rookRegex.test(item)),
  );
};

export const getCephPVs = (pvsData: K8sResourceKind[] = []): K8sResourceKind[] =>
  pvsData.filter((pv) => {
    return cephStorageProvisioners.some((provisioner: string) =>
      (pv?.metadata?.annotations?.['pv.kubernetes.io/provisioned-by'] ?? '').includes(provisioner),
    );
  });

const getPVStorageClass = (pv: K8sResourceKind) => pv?.spec?.storageClassName;
export const getStorageClassName = (pvc: K8sResourceKind) =>
  pvc?.spec?.storageClassName ||
  pvc?.metadata?.annotations?.['volume.beta.kubernetes.io/storage-class'];

const isBound = (pvc: K8sResourceKind) => pvc.status.phase === status.BOUND;

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
  nodesData.filter((node) => Object.keys(node?.metadata?.labels).includes(cephStorageLabel));

export const getCephSC = (scData: StorageClassResourceKind[]): K8sResourceKind[] =>
  scData.filter((sc) => {
    return cephStorageProvisioners.some((provisioner: string) =>
      (sc?.provisioner).includes(provisioner),
    );
  });

export const getOperatorVersion = (operator: K8sResourceKind): string =>
  operator?.status?.installedCSV;

export const getOCSVersion = (items: FirehoseResult): string => {
  const itemsData: K8sResourceKind[] = items?.data;
  const operator: K8sResourceKind = _.find(itemsData, (item) => item?.spec?.name === OCS_OPERATOR);
  return getOperatorVersion(operator);
};

export const getODFVersion = (items: FirehoseResult): string => {
  const itemsData: K8sResourceKind[] = items?.data;
  const operator: K8sResourceKind = _.find(itemsData, (item) => item?.spec?.name === ODF_OPERATOR);
  return getOperatorVersion(operator);
};

export const calcPVsCapacity = (pvs: K8sResourceKind[]): number =>
  pvs.reduce((sum, pv) => {
    const storage = Number(convertToBaseValue(pv.spec.capacity.storage));
    return sum + storage;
  }, 0);

export const getSCAvailablePVs = (pvsData: K8sResourceKind[], sc: string): K8sResourceKind[] =>
  pvsData.filter((pv) => getPVStorageClass(pv) === sc && pv.status.phase === status.AVAILABLE);
