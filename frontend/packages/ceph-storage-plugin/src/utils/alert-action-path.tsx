import { Alert } from '@console/internal/components/monitoring/types';
import { history } from '@console/internal/components/utils';
import { k8sGet } from '@console/internal/module/k8s';
import { CEPH_STORAGE_NAMESPACE } from '../constants';
import { OCSServiceModel } from '../models';

export const getAlertActionPath = (alertData: Alert) =>
  history.push(
    `/k8s/cluster/nodes/${alertData.labels.host}/disks?node-disk-name=${alertData.labels.device}`,
  );

export const launchClusterExpansionModal = async () => {
  try {
    const resources = await k8sGet(OCSServiceModel, null, CEPH_STORAGE_NAMESPACE);
    const ocsConfig = resources?.items?.[0];
    const modal = await import(
      '../components/modals/add-capacity-modal/add-capacity-modal' /* webpackChunkName: "ceph-storage-add-capacity-modal" */
    );
    modal.addCapacityModal({ ocsConfig });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error launching modal', e);
  }
};
