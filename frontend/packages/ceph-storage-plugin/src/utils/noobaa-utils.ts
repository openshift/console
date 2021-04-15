import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { Alert } from '@console/internal/components/monitoring/types';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';
import { K8sResourceKind, DeploymentKind } from '@console/internal/module/k8s/types';
import { StorageClass } from '@console/internal/components/storage-class-form';
import { SecretModel } from '@console/internal/models';
import { getAPIVersion } from '@console/shared/src/selectors/common';
import { BackingStoreKind, BucketClassKind, NamespaceStoreKind, PlacementPolicy } from '../types';
import { StoreType } from '../constants/common';
import {
  PROVIDERS_NOOBAA_MAP,
  BUCKET_LABEL_NOOBAA_MAP,
  BC_PROVIDERS,
  AWS_REGIONS,
  NS_PROVIDERS_NOOBAA_MAP,
} from '../constants/providers';

export const filterNooBaaAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'annotations.storage_type') === 'NooBaa');

export const filterRGWAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => alert?.annotations?.storage_type === 'RGW');

export const getMetric = (result: PrometheusResponse, metric: string): string =>
  _.get(result, ['data', 'result', '0', 'metric', metric], null);

export type PrometheusMetricResult = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};

export const getPhase = (obj: K8sResourceKind): string => {
  return _.get(obj, 'status.phase', 'Lost');
};

export const isBound = (obj: K8sResourceKind): boolean => getPhase(obj) === 'Bound';

export const getSCProvisioner = (obj: StorageClass) => obj.provisioner;

export const isFunctionThenApply = (fn: any) => (args: string) =>
  typeof fn === 'function' ? fn(args) : fn;

export const decodeRGWPrefix = (secretData: K8sResourceKind) => {
  try {
    return JSON.parse(atob(secretData?.data?.external_cluster_details)).find(
      (item) => item?.name === 'ceph-rgw',
    )?.data?.poolPrefix;
  } catch {
    return '';
  }
};

export const convertNaNToNull = (value: DataPoint) =>
  _.isNaN(value?.y) ? Object.assign(value, { y: null }) : value;
// (Todo: bipuladh) Refactor this page into selectors file

export const getBackingStoreType = (bs: BackingStoreKind): BC_PROVIDERS => {
  let type: BC_PROVIDERS = null;
  _.forEach(PROVIDERS_NOOBAA_MAP, (v, k) => {
    if (bs?.spec?.[v]) {
      type = k as BC_PROVIDERS;
    }
  });
  return type;
};

export const getNamespaceStoreType = (ns: NamespaceStoreKind): BC_PROVIDERS => {
  let type: BC_PROVIDERS = null;
  Object.entries(NS_PROVIDERS_NOOBAA_MAP).forEach(([k, v]) => {
    if (ns?.spec?.[v]) {
      type = k as BC_PROVIDERS;
    }
  });
  return type;
};

export const getBucketName = (bs: BackingStoreKind): string => {
  const type = getBackingStoreType(bs);
  return bs.spec?.[PROVIDERS_NOOBAA_MAP[type]]?.[BUCKET_LABEL_NOOBAA_MAP[type]];
};

export const getRegion = (bs: BackingStoreKind): string => {
  const type = getBackingStoreType(bs);
  return bs.spec?.[PROVIDERS_NOOBAA_MAP[type]]?.region;
};

export const getNSRegion = (ns: NamespaceStoreKind): string => {
  const type = getNamespaceStoreType(ns);
  return ns.spec?.[NS_PROVIDERS_NOOBAA_MAP[type]]?.region;
};

export const getBackingStoreNames = (bc: BucketClassKind, tier: 0 | 1): string[] =>
  bc.spec.placementPolicy?.tiers?.[tier]?.backingStores ?? [];

export const getBackingStorePolicy = (bc: BucketClassKind, tier: 0 | 1): PlacementPolicy =>
  bc.spec.placementPolicy?.tiers?.[tier]?.placement;

export const getBSLabel = (policy: PlacementPolicy, t: TFunction) =>
  policy === PlacementPolicy.Mirror
    ? t('ceph-storage-plugin~Select at least 2 Backing Store resources')
    : t('ceph-storage-plugin~Select at least 1 Backing Store resource');

export const awsRegionItems = _.zipObject(AWS_REGIONS, AWS_REGIONS);
export const endpointsSupported = [BC_PROVIDERS.S3, BC_PROVIDERS.IBM];
export const getProviders = (type: StoreType) => {
  const values =
    type === StoreType.BS
      ? Object.values(BC_PROVIDERS)
      : Object.values(BC_PROVIDERS).filter(
          (provider) => provider !== BC_PROVIDERS.GCP && provider !== BC_PROVIDERS.PVC,
        );
  return _.zipObject(values, values);
};

export const getExternalProviders = (type: StoreType) => {
  return type === StoreType.NS
    ? [BC_PROVIDERS.AWS, BC_PROVIDERS.AZURE, BC_PROVIDERS.S3, BC_PROVIDERS.IBM]
    : [BC_PROVIDERS.AWS, BC_PROVIDERS.AZURE, BC_PROVIDERS.S3, BC_PROVIDERS.GCP, BC_PROVIDERS.IBM];
};

export const secretPayloadCreator = (
  provider: string,
  namespace: string,
  secretName: string,
  field1: string,
  field2 = '',
) => {
  const payload = {
    apiVersion: getAPIVersion(SecretModel),
    kind: SecretModel.kind,
    stringData: {},
    metadata: {
      name: secretName,
      namespace,
    },
    type: 'Opaque',
  };

  switch (provider) {
    case BC_PROVIDERS.AZURE:
      payload.stringData = {
        AccountName: field1,
        AccountKey: field2,
      };
      break;
    case BC_PROVIDERS.IBM:
      payload.stringData = {
        IBM_COS_ACCESS_KEY_ID: field1,
        IBM_COS_SECRET_ACCESS_KEY: field2,
      };
      break;
    default:
      payload.stringData = {
        AWS_ACCESS_KEY_ID: field1,
        AWS_SECRET_ACCESS_KEY: field2,
      };
      break;
  }
  return payload;
};

// Attaching OBC to a particular deployment

export const getAttachOBCPatch = (obcName: string, deployment: DeploymentKind) => {
  const configMapRef = {
    configMapRef: {
      name: obcName,
    },
  };
  const secretMapRef = {
    secretRef: {
      name: obcName,
    },
  };

  const containers = deployment?.spec?.template?.spec?.containers ?? [];
  const patches = containers.reduce((patch, container, i) => {
    if (_.isEmpty(container.envFrom)) {
      patch.push({
        op: 'add',
        path: `/spec/template/spec/containers/${i}/envFrom`,
        value: [configMapRef],
      });
      patch.push({
        op: 'add',
        path: `/spec/template/spec/containers/${i}/envFrom/-`,
        value: secretMapRef,
      });
    } else {
      patch.push({
        op: 'add',
        path: `/spec/template/spec/containers/${i}/envFrom/-`,
        value: configMapRef,
      });
      patch.push({
        op: 'add',
        path: `/spec/template/spec/containers/${i}/envFrom/-`,
        value: secretMapRef,
      });
    }
    return patch;
  }, []);
  return patches;
};
