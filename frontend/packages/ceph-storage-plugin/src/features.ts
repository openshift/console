import { K8sResourceKind } from '@console/internal/module/k8s';
import { setFlag, handleError } from '@console/internal/actions/features';
import { ActionFeatureFlagDetector } from '@console/plugin-sdk';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import { OCSServiceModel } from './models';
import { OCS_INDEPENDENT_CR_NAME, CEPH_STORAGE_NAMESPACE } from './constants';
import { fetchURL } from '@console/internal/graphql/client';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';

const isIndependent = (data: K8sResourceKind): boolean =>
  data.spec?.externalStorage?.enable ?? false;

export const detectIndependentMode: ActionFeatureFlagDetector = (dispatch) =>
  fetchURL<K8sResourceKind>(`/apis/namespaces/${CEPH_STORAGE_NAMESPACE}/${OCSServiceModel.plural}/${OCS_INDEPENDENT_CR_NAME}`).then(
    (obj) => dispatch(setFlag(OCS_INDEPENDENT_FLAG, isIndependent(obj))),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(OCS_INDEPENDENT_FLAG, false))
        : handleError(err, OCS_INDEPENDENT_FLAG, dispatch, detectIndependentMode);
    },
  );

export const OCS_VERSION_4_5_FLAG = 'OCS_VERSION_4_5_FLAG';

export const isOCS45AndAboveVersion = (subscription: K8sResourceKind): boolean => {
  const version = subscription?.status?.currentCSV;
  return version && version.includes('ocs-operator.v4') && version.split('.')[2] >= 5;
};

export const detectOCSVersion45AndAbove: ActionFeatureFlagDetector = (dispatch) =>
  fetchURL<K8sResourceKind>(`/apis/namespaces/${CEPH_STORAGE_NAMESPACE}/${SubscriptionModel.plural}/ocs-subscription`).then(
    (obj) => dispatch(setFlag(OCS_VERSION_4_5_FLAG, isOCS45AndAboveVersion(obj))),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(OCS_VERSION_4_5_FLAG, false))
        : handleError(err, OCS_VERSION_4_5_FLAG, dispatch, detectOCSVersion45AndAbove);
    },
  );
