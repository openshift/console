import * as _ from 'lodash';
import { Dispatch } from 'react-redux';
import { k8sGet, k8sList, StorageClassResourceKind, ListKind } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { setFlag } from '@console/internal/actions/features';
import { FeatureDetector } from '@console/plugin-sdk';
import { getAnnotations, getName } from '@console/shared/src/selectors/common';
import { fetchK8s } from '@console/internal/graphql/client';
import { NamespaceModel, StorageClassModel } from '@console/internal/models';
import { OCSServiceModel, CephClusterModel, NooBaaSystemModel } from './models';
import {
  CEPH_STORAGE_NAMESPACE,
  OCS_SUPPORT_ANNOTATION,
  RGW_PROVISIONER,
  SECOND,
  OCS_OPERATOR,
  NOOBAA_PROVISIONER,
  ODF_MANAGED_LABEL,
  OCS_DISABLED_ANNOTATION,
} from './constants';
import { StorageClusterKind } from './types';

export const OCS_INDEPENDENT_FLAG = 'OCS_INDEPENDENT';
export const OCS_CONVERGED_FLAG = 'OCS_CONVERGED';

export const ODF_MANAGED_FLAG = 'ODF_MANAGED';

export const LSO_FLAG = 'LSO';

export const RGW_FLAG = 'RGW';

// Based on the existence of NooBaaSystem
export const MCG_FLAG = 'MCG';
// Based on the existence of CephCluster
export const CEPH_FLAG = 'CEPH';
// Based on the existence of StorageCluster
export const OCS_FLAG = 'OCS';

export const MCG_STANDALONE = 'MCG_STANDALONE';

export enum FEATURES {
  // Flag names to be prefixed with "OCS_" so as to seperate from console flags
  OCS_MULTUS = 'OCS_MULTUS',
  OCS_ARBITER = 'OCS_ARBITER',
  OCS_KMS = 'OCS_KMS',
  OCS_FLEXIBLE_SCALING = 'OCS_FLEXIBLE_SCALING',
  OCS_TAINT_NODES = 'OCS_TAINT_NODES',
  OCS_THICK_PROVISION = 'OCS_THICK_PROVISION',
  OCS_POOL_MANAGEMENT = 'OCS_POOL_MANAGEMENT',
  OCS_NAMESPACE_STORE = 'OCS_NAMESPACE_STORE',
  ODF_MCG_STANDALONE = 'ODF_MCG_STANDALONE',
  ODF_HPCS_KMS = 'ODF_HPCS_KMS',
  ODF_VAULT_SA_KMS = 'ODF_VAULT_SA_KMS',
  SS_LIST = 'ODF_SS_LIST',
  ADD_CAPACITY = 'ODF_ADD_CAPACITY',
}

const OCS_FEATURE_FLAGS = {
  // [flag name]: <value of flag in csv annotation>
  [FEATURES.OCS_MULTUS]: 'multus',
  [FEATURES.OCS_ARBITER]: 'arbiter',
  [FEATURES.OCS_KMS]: 'kms',
  [FEATURES.OCS_FLEXIBLE_SCALING]: 'flexible-scaling',
  [FEATURES.OCS_TAINT_NODES]: 'taint-nodes',
  [FEATURES.OCS_THICK_PROVISION]: 'thick-provision',
  [FEATURES.OCS_POOL_MANAGEMENT]: 'pool-management',
  [FEATURES.OCS_NAMESPACE_STORE]: 'namespace-store',
  [FEATURES.ODF_MCG_STANDALONE]: 'mcg-standalone',
  [FEATURES.ODF_HPCS_KMS]: 'hpcs-kms',
  [FEATURES.ODF_VAULT_SA_KMS]: 'vault-sa-kms',
};

export const ODF_BLOCK_FLAG = {
  [FEATURES.SS_LIST]: 'ss-list',
  [FEATURES.ADD_CAPACITY]: 'add-capacity',
};

const handleError = (res: any, flags: string[], dispatch: Dispatch, cb: FeatureDetector) => {
  if (res?.response instanceof Response) {
    const status = res?.response?.status;
    if (_.includes([403, 502], status)) {
      flags.forEach((feature) => {
        dispatch(setFlag(feature, undefined));
      });
    }
    if (!_.includes([401, 403, 500], status)) {
      setTimeout(() => cb(dispatch), 15000);
    }
  } else {
    flags.forEach((feature) => {
      dispatch(setFlag(feature, undefined));
    });
  }
};

// To be Run only once the Storage Cluster is Installed
// RGW storageClass should init. first => Noobaa consumes RGW to create a backingStore
// Stops polling when either the RGW storageClass or the Noobaa Storage Class comes up
export const detectRGW: FeatureDetector = async (dispatch) => {
  let id = null;
  let isInitial = true;
  const logicHandler = () =>
    k8sList(StorageClassModel)
      .then((data: StorageClassResourceKind[]) => {
        const isRGWPresent = data.some((sc) => sc.provisioner === RGW_PROVISIONER);
        const isNooBaaPresent = data.some((sc) => sc.provisioner === NOOBAA_PROVISIONER);
        if (isRGWPresent) {
          dispatch(setFlag(RGW_FLAG, true));
          clearInterval(id);
        } else {
          if (isInitial === true) {
            dispatch(setFlag(RGW_FLAG, false));
            isInitial = false;
          }
          // If Noobaa already has come up; Platform doesn't support RGW; stop polling
          if (isNooBaaPresent) {
            clearInterval(id);
          }
        }
      })
      .catch((error) => {
        if (error?.response instanceof Response) {
          const status = error?.response?.status;
          if (_.includes([403, 502], status)) {
            dispatch(setFlag(RGW_FLAG, false));
            clearInterval(id);
          }
          if (!_.includes([401, 403, 500], status) && isInitial === true) {
            dispatch(setFlag(RGW_FLAG, false));
            isInitial = false;
          }
        } else {
          clearInterval(id);
        }
      });
  // calling first time instantaneously
  // else it will wait for 15s before start polling
  logicHandler();
  id = setInterval(logicHandler, 15 * SECOND);
};

export const detectOCS: FeatureDetector = async (dispatch) => {
  let ocsIntervalId = null;
  const ocsDetector = async () => {
    try {
      const storageClusters = await k8sList(OCSServiceModel, { ns: CEPH_STORAGE_NAMESPACE });
      if (storageClusters?.length > 0) {
        const storageCluster = storageClusters.find(
          (sc: StorageClusterKind) => sc.status.phase !== 'Ignored',
        );
        const isInternal = _.isEmpty(storageCluster?.spec?.externalStorage);
        dispatch(setFlag(OCS_CONVERGED_FLAG, isInternal));
        dispatch(setFlag(OCS_INDEPENDENT_FLAG, !isInternal));
        dispatch(setFlag(OCS_FLAG, true));
        dispatch(
          setFlag(
            MCG_STANDALONE,
            storageCluster?.spec?.multiCloudGateway?.reconcileStrategy === 'standalone',
          ),
        );
        clearInterval(ocsIntervalId);
      }
    } catch (error) {
      dispatch(setFlag(OCS_FLAG, false));
      dispatch(setFlag(OCS_CONVERGED_FLAG, false));
      dispatch(setFlag(OCS_INDEPENDENT_FLAG, false));
    }
  };

  // calling first time instantaneously
  // else it will wait for 15s before start polling
  ocsDetector();
  ocsIntervalId = setInterval(ocsDetector, 15 * SECOND);
};

export const detectManagedODF: FeatureDetector = async (dispatch) => {
  try {
    const ns = await k8sGet(NamespaceModel, CEPH_STORAGE_NAMESPACE);
    if (ns) {
      const isManagedCluster = ns?.metadata?.labels?.[ODF_MANAGED_LABEL];
      dispatch(setFlag(ODF_MANAGED_FLAG, !!isManagedCluster));
    }
  } catch (error) {
    dispatch(setFlag(ODF_MANAGED_FLAG, false));
  }
};

export const detectComponents: FeatureDetector = async (dispatch) => {
  let cephIntervalId = null;
  let noobaaIntervalId = null;
  const cephDetector = async () => {
    try {
      const cephClusters = await k8sList(CephClusterModel, { ns: CEPH_STORAGE_NAMESPACE });
      if (cephClusters?.length > 0) {
        dispatch(setFlag(CEPH_FLAG, true));
        clearInterval(cephIntervalId);
      }
    } catch {
      dispatch(setFlag(CEPH_FLAG, false));
    }
  };
  const noobaaDetector = async () => {
    try {
      const noobaaSystems = await k8sList(NooBaaSystemModel, { ns: CEPH_STORAGE_NAMESPACE });
      if (noobaaSystems?.length > 0) {
        dispatch(setFlag(MCG_FLAG, true));
        clearInterval(noobaaIntervalId);
        clearInterval(cephIntervalId);
      }
    } catch {
      dispatch(setFlag(MCG_FLAG, false));
    }
  };

  // calling first time instantaneously
  // else it will wait for 15s before start polling
  cephDetector();
  noobaaDetector();
  cephIntervalId = setInterval(cephDetector, 15 * SECOND);
  noobaaIntervalId = setInterval(noobaaDetector, 15 * SECOND);
};

const detectFeatures = (dispatch, csv: ClusterServiceVersionKind) => {
  const support = JSON.parse(getAnnotations(csv)?.[OCS_SUPPORT_ANNOTATION]);
  _.keys(OCS_FEATURE_FLAGS).forEach((feature) => {
    dispatch(setFlag(feature, support.includes(OCS_FEATURE_FLAGS[feature])));
  });
  // Todo(bipuladh): Remove array string after CI starts using ODF 4.10
  const disabled = JSON.parse(getAnnotations(csv)?.[OCS_DISABLED_ANNOTATION] || '[]');
  _.keys(ODF_BLOCK_FLAG).forEach((feature) => {
    dispatch(setFlag(feature, disabled.includes(ODF_BLOCK_FLAG[feature])));
  });
};

export const detectOCSSupportedFeatures: FeatureDetector = async (dispatch) => {
  try {
    const csvList = await fetchK8s<ListKind<ClusterServiceVersionKind>>(
      ClusterServiceVersionModel,
      '',
      CEPH_STORAGE_NAMESPACE,
    );
    const ocsCSV = csvList.items.find((obj) => _.startsWith(getName(obj), OCS_OPERATOR));
    if (ocsCSV) {
      detectFeatures(dispatch, ocsCSV);
    } else {
      // If OCS CSV is not present then poll
      setTimeout(() => detectOCSSupportedFeatures(dispatch), 15 * SECOND);
    }
  } catch (error) {
    handleError(error, _.keys(OCS_FEATURE_FLAGS), dispatch, detectOCSSupportedFeatures);
  }
};
