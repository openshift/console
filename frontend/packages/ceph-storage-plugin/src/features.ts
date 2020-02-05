import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { setFlag, handleError } from '@console/internal/actions/features';
import { ActionFeatureFlagDetector } from '@console/plugin-sdk';
import { OCSServiceModel } from './models';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';

const isIndependent = (data: K8sResourceKind): boolean =>
  data.spec?.externalStorage?.enabled ?? false;

export const detectIndependentMode: ActionFeatureFlagDetector = (dispatch) =>
  k8sGet(OCSServiceModel, 'ocs-independent-storagecluster', 'openshift-storage').then(
    (obj: K8sResourceKind) => dispatch(setFlag(OCS_INDEPENDENT_FLAG, isIndependent(obj))),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(OCS_INDEPENDENT_FLAG, false))
        : handleError(err, OCS_INDEPENDENT_FLAG, dispatch, detectIndependentMode);
    },
  );
