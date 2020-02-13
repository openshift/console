import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { setFlag, handleError } from '@console/internal/actions/features';
import { ActionFeatureFlagDetector } from '@console/plugin-sdk';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import { OCSServiceModel } from './models';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';

const isIndependent = (data: K8sResourceKind): boolean => !!data.spec?.external;

export const detectIndependentMode: ActionFeatureFlagDetector = (dispatch) =>
  k8sGet(OCSServiceModel, 'ocs-storagecluster', 'openshift-storage').then(
    (obj: K8sResourceKind) => dispatch(setFlag(OCS_INDEPENDENT_FLAG, isIndependent(obj))),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(OCS_INDEPENDENT_FLAG, false))
        : handleError(err, OCS_INDEPENDENT_FLAG, dispatch, detectIndependentMode);
    },
  );

export const OCS_VERSION_4_4_FLAG = 'OCS_VERSION_4_4';

export const isOCS44Version = (subscription: K8sResourceKind): boolean => {
  const version = subscription?.status?.currentCSV;
  return version && version.includes('ocs-operator.v4.4');
};

export const detectOCSVersion44: ActionFeatureFlagDetector = (dispatch) =>
  k8sGet(SubscriptionModel, 'ocs-subscription', 'openshift-storage').then(
    (obj: K8sResourceKind) => dispatch(setFlag(OCS_VERSION_4_4_FLAG, isOCS44Version(obj))),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(OCS_VERSION_4_4_FLAG, false))
        : handleError(err, OCS_VERSION_4_4_FLAG, dispatch, detectOCSVersion44);
    },
  );
