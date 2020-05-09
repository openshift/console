import * as _ from 'lodash';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel, SubscriptionModel } from '@console/operator-lifecycle-manager';
import { handleError, setFlag } from '@console/internal/actions/features';
import { FeatureDetector } from '@console/plugin-sdk';
import { OCSServiceModel } from './models';
import {
  OCS_INDEPENDENT_CR_NAME,
  CEPH_STORAGE_NAMESPACE,
  OCS_SUPPORT_ANNOTATION,
} from './constants';
import { getAnnotations } from '@console/shared/src/selectors/common';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';

const isIndependent = (data: K8sResourceKind): boolean =>
  data.spec?.externalStorage?.enable ?? false;

export const detectIndependentMode: FeatureDetector = (dispatch) =>
  k8sGet(OCSServiceModel, OCS_INDEPENDENT_CR_NAME, CEPH_STORAGE_NAMESPACE).then(
    (obj: K8sResourceKind) => dispatch(setFlag(OCS_INDEPENDENT_FLAG, isIndependent(obj))),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(OCS_INDEPENDENT_FLAG, false))
        : handleError(err, OCS_INDEPENDENT_FLAG, dispatch, detectIndependentMode);
    },
  );

/* Key and Value should be same value received in CSV  */
export const OCS_SUPPORT_FLAGS = {
  SNAPSHOT: 'SNAPSHOT',
  EXTERNAL: 'EXTERNAL',
};

const handleOCSError = (res, flags, dispatch, cb) => {
  const status = res?.response?.status;
  if (_.includes([403, 502], status)) {
    _.keys(flags).forEach((feature) => {
      dispatch(setFlag(feature, undefined));
    });
  }
  if (!_.includes([401, 403, 500], status)) {
    setTimeout(() => cb(dispatch), 15000);
  }
};

export const detectOCSSupportedFeatures: FeatureDetector = async (dispatch) => {
  try {
    const subscription = await k8sGet(
      SubscriptionModel,
      'ocs-subscription',
      CEPH_STORAGE_NAMESPACE,
    );
    const ocsCSV = await k8sGet(
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
      : handleOCSError(error, OCS_SUPPORT_FLAGS, dispatch, detectOCSSupportedFeatures);
  }
};
