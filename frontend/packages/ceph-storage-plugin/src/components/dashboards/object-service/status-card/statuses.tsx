import { TFunction } from 'i18next';
import { PrometheusHealthHandler, SubsystemHealth } from '@console/plugin-sdk';
import { HealthState } from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/status-card/states';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getGaugeValue } from '../../../../utils';
import { Phase } from '../../../../constants';

const nooBaaStatus = (status: string, t: TFunction): SubsystemHealth => {
  switch (status) {
    case '0':
      return { state: HealthState.OK };
    case '1':
      return {
        state: HealthState.ERROR,
        message: t('ceph-storage-plugin~All resources are unhealthy'),
      };
    case '2':
      return {
        state: HealthState.WARNING,
        message: t('ceph-storage-plugin~Object Bucket has an issue'),
      };
    case '3':
      return {
        state: HealthState.ERROR,
        message: t('ceph-storage-plugin~Many buckets have issues'),
      };
    case '4':
      return {
        state: HealthState.WARNING,
        message: t('ceph-storage-plugin~Some buckets have issues'),
      };
    default:
      return { state: HealthState.UNKNOWN };
  }
};

export const getNooBaaState: PrometheusHealthHandler = (responses, t, noobaa) => {
  const { response, error } = responses[0];
  const noobaaLoaded = noobaa?.loaded;
  const noobaaLoadError = noobaa?.loadError;
  const statusIndex: string = getGaugeValue(response);

  if (error || noobaaLoadError) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!noobaaLoaded || !response) {
    return { state: HealthState.LOADING };
  }
  if (!statusIndex) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  return nooBaaStatus(statusIndex, t);
};

export const getRGWHealthState = (cr: K8sResourceKind): SubsystemHealth => {
  const health = cr?.status?.phase;
  if (!health) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  switch (health) {
    case Phase.CONNECTED:
      return { state: HealthState.OK };
    // Applicable only for OCS 4.5
    case Phase.READY:
      return { state: HealthState.OK };
    case Phase.PROGRESSING:
      return { state: HealthState.PROGRESS };
    case Phase.FAILURE:
      return { state: HealthState.ERROR };
    default:
      return { state: HealthState.UNKNOWN };
  }
};
