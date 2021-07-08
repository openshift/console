import { setFlag, handleError } from '@console/internal/actions/features';
import { K8sKind, k8sList } from '@console/internal/module/k8s';
import { FeatureDetector } from '@console/plugin-sdk';
import { getAnnotations } from '@console/shared/src/selectors/common';

export const OCSServiceModel: K8sKind = {
  label: 'Storage Cluster',
  labelPlural: 'Storage Clusters',
  apiVersion: 'v1',
  apiGroup: 'ocs.openshift.io',
  plural: 'storageclusters',
  abbr: 'OCS',
  namespaced: true,
  kind: 'StorageCluster',
  id: 'ocscluster',
  crd: true,
};
const ATTACHED_DEVICES_ANNOTATION = 'cluster.ocs.openshift.io/local-devices';
export const OCS_ATTACHED_DEVICES_FLAG = 'OCS_ATTACHED_DEVICES';

export const detectOCSAttachedDeviceMode: FeatureDetector = async (dispatch) => {
  try {
    const storageClusters = await k8sList(OCSServiceModel, { ns: 'openshift-storage' });
    const storageCluster = storageClusters.find((sc) => sc.status.phase !== 'Ignored');
    const isAttachedDevicesCluster =
      getAnnotations(storageCluster)?.[ATTACHED_DEVICES_ANNOTATION] === 'true';
    dispatch(setFlag(OCS_ATTACHED_DEVICES_FLAG, isAttachedDevicesCluster));
  } catch (err) {
    err?.response?.status === 404
      ? dispatch(setFlag(OCS_ATTACHED_DEVICES_FLAG, false))
      : handleError(err, OCS_ATTACHED_DEVICES_FLAG, dispatch, detectOCSAttachedDeviceMode);
  }
};
