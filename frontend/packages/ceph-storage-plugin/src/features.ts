import * as _ from 'lodash';
import { Dispatch } from 'react-redux';
import { K8sResourceKind, k8sList, StorageClassResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel, SubscriptionModel } from '@console/operator-lifecycle-manager';
import { setFlag } from '@console/internal/actions/features';
import { FeatureDetector } from '@console/plugin-sdk';
import { getAnnotations } from '@console/shared/src/selectors/common';
import { fetchK8s } from '@console/internal/graphql/client';
import { StorageClassModel } from '@console/internal/models';
import { OCSServiceModel } from './models';
import {
  OCS_EXTERNAL_CR_NAME,
  CEPH_STORAGE_NAMESPACE,
  OCS_SUPPORT_ANNOTATION,
  ATTACHED_DEVICES_ANNOTATION,
  OCS_INTERNAL_CR_NAME,
  RGW_PROVISIONER,
  SECOND,
} from './constants';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';
export const OCS_CONVERGED_FLAG = 'OCS_CONVERGED';
export const OCS_ATTACHED_DEVICES_FLAG = 'OCS_ATTACHED_DEVICES';
// Used to activate NooBaa dashboard
export const OCS_FLAG = 'OCS';
// Todo(bipuladh): Remove this completely in 4.6
export const CEPH_FLAG = 'CEPH';

export const LSO_FLAG = 'LSO';

export const RGW_FLAG = 'RGW';

/* Key and Value should be same value received in CSV  */
export const OCS_SUPPORT_FLAGS = {
  SNAPSHOT: 'SNAPSHOT',
  EXTERNAL: 'EXTERNAL',
};

const handleError = (res: any, flags: string[], dispatch: Dispatch, cb: FeatureDetector) => {
  const status = res?.response?.status;
  if (_.includes([403, 502], status)) {
    flags.forEach((feature) => {
      dispatch(setFlag(feature, undefined));
    });
  }
  if (!_.includes([401, 403, 500], status)) {
    setTimeout(() => cb(dispatch), 15000);
  }
};

export const detectRGW: FeatureDetector = async (dispatch) => {
  let id = null;
  const logicHandler = () =>
    k8sList(StorageClassModel)
      .then((data: StorageClassResourceKind[]) => {
        const isRGWPresent = data.some((sc) => sc.provisioner === RGW_PROVISIONER);
        if (isRGWPresent) {
          dispatch(setFlag(RGW_FLAG, true));
          clearInterval(id);
        } else {
          dispatch(setFlag(RGW_FLAG, false));
        }
      })
      .catch(() => {
        clearInterval(id);
      });
  id = setInterval(logicHandler, 10 * SECOND);
};

export const detectOCS: FeatureDetector = async (dispatch) => {
  try {
    const storageCluster = await fetchK8s(
      OCSServiceModel,
      OCS_INTERNAL_CR_NAME,
      CEPH_STORAGE_NAMESPACE,
    );
    const isAttachedDevicesCluster =
      getAnnotations(storageCluster)?.[ATTACHED_DEVICES_ANNOTATION] === 'true';
    dispatch(setFlag(OCS_FLAG, true));
    dispatch(setFlag(OCS_ATTACHED_DEVICES_FLAG, isAttachedDevicesCluster));
    dispatch(setFlag(OCS_CONVERGED_FLAG, true));
    dispatch(setFlag(OCS_INDEPENDENT_FLAG, false));
  } catch (e) {
    if (e?.response?.status !== 404) handleError(e, [OCS_CONVERGED_FLAG], dispatch, detectOCS);
    else {
      dispatch(setFlag(OCS_CONVERGED_FLAG, false));
      dispatch(setFlag(OCS_ATTACHED_DEVICES_FLAG, false));
    }
    try {
      await fetchK8s(OCSServiceModel, OCS_EXTERNAL_CR_NAME, CEPH_STORAGE_NAMESPACE);
      dispatch(setFlag(OCS_FLAG, true));
      dispatch(setFlag(OCS_INDEPENDENT_FLAG, true));
      dispatch(setFlag(OCS_CONVERGED_FLAG, false));
      dispatch(setFlag(OCS_ATTACHED_DEVICES_FLAG, false));
    } catch (err) {
      err?.response?.status !== 404
        ? handleError(err, [OCS_INDEPENDENT_FLAG], dispatch, detectOCS)
        : dispatch(setFlag(OCS_INDEPENDENT_FLAG, false));
    }
  }
};

export const detectOCSSupportedFeatures: FeatureDetector = async (dispatch) => {
  try {
    const subscription = await fetchK8s<K8sResourceKind>(
      SubscriptionModel,
      'ocs-subscription',
      CEPH_STORAGE_NAMESPACE,
    );
    const ocsCSV = await fetchK8s(
      ClusterServiceVersionModel,
      subscription?.status?.currentCSV,
      CEPH_STORAGE_NAMESPACE,
    );

    const support = getAnnotations(ocsCSV)[OCS_SUPPORT_ANNOTATION];
    _.keys(OCS_SUPPORT_FLAGS).forEach((feature) => {
      dispatch(setFlag(feature, support.includes(feature.toLowerCase())));
    });
  } catch (error) {
    error?.response?.status === 404
      ? _.keys(OCS_SUPPORT_FLAGS).forEach((feature) => {
          dispatch(setFlag(feature, false));
        })
      : handleError(error, _.keys(OCS_SUPPORT_FLAGS), dispatch, detectOCSSupportedFeatures);
  }
};
