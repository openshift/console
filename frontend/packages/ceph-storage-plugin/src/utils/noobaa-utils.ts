import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { Alert } from '@console/internal/components/monitoring/types';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { StorageClass } from '@console/internal/components/storage-class-form';
import { PROVIDERS_NOOBAA_MAP, BUCKET_LABEL_NOOBAA_MAP, BC_PROVIDERS } from '../constants';
import { BackingStoreKind, BucketClassKind, PlacementPolicy } from '../types';

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

export const getBucketName = (bs: BackingStoreKind): string => {
  const type = getBackingStoreType(bs);
  return bs.spec?.[PROVIDERS_NOOBAA_MAP[type]]?.[BUCKET_LABEL_NOOBAA_MAP[type]];
};

export const getRegion = (bs: BackingStoreKind): string => {
  const type = getBackingStoreType(bs);
  return bs.spec?.[PROVIDERS_NOOBAA_MAP[type]]?.region;
};

export const getBackingStoreNames = (bc: BucketClassKind, tier: 0 | 1): string[] =>
  bc.spec.placementPolicy?.tiers?.[tier]?.backingStores ?? [];

export const getBackingStorePolicy = (bc: BucketClassKind, tier: 0 | 1): PlacementPolicy =>
  bc.spec.placementPolicy?.tiers?.[tier]?.placement;

export const getBSLabel = (policy: PlacementPolicy, t: TFunction) =>
  policy === PlacementPolicy.Mirror
    ? t('ceph-storage-plugin~Select at least 2 Backing Store resources')
    : t('ceph-storage-plugin~Select at least 1 Backing Store resource');
