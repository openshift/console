import { TFunction } from 'i18next';
import {
  PrometheusHealthHandler,
  ResourceHealthHandler,
  SubsystemHealth,
} from '@console/plugin-sdk';
import { HealthState } from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/status-card/states';
import { getResiliencyProgress } from '../../../../utils';
import { WatchCephResource } from '../../../../types';

const CephHealthStatus = (status: string, t: TFunction): SubsystemHealth => {
  switch (status) {
    case 'HEALTH_OK':
      return {
        state: HealthState.OK,
      };
    case 'HEALTH_WARN':
      return {
        state: HealthState.WARNING,
        message: t('ceph-storage-plugin~Warning'),
      };
    case 'HEALTH_ERR':
      return {
        state: HealthState.ERROR,
        message: t('ceph-storage-plugin~Error'),
      };
    default:
      return { state: HealthState.UNKNOWN };
  }
};

export const getCephHealthState: ResourceHealthHandler<WatchCephResource> = ({ ceph }, t) => {
  const { data, loaded, loadError } = ceph;
  const status = data?.[0]?.status?.ceph?.health;

  if (loadError) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!loaded) {
    return { state: HealthState.LOADING };
  }
  if (data.length === 0) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  return CephHealthStatus(status, t);
};

export const getDataResiliencyState: PrometheusHealthHandler = (responses, t) => {
  const progress: number = getResiliencyProgress(responses[0].response);
  if (responses[0].error) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!responses[0].response) {
    return { state: HealthState.LOADING };
  }
  if (Number.isNaN(progress)) {
    return { state: HealthState.UNKNOWN };
  }
  if (progress < 1) {
    return { state: HealthState.PROGRESS, message: t('ceph-storage-plugin~Progressing') };
  }
  return { state: HealthState.OK };
};
