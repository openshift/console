import { PrometheusHealthHandler, ResourceHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { getResiliencyProgress } from '../../../../utils';
import { WatchCephResource } from '../../../../types';

const CephHealthStatus = {
  HEALTH_OK: {
    state: HealthState.OK,
  },
  HEALTH_WARN: {
    state: HealthState.WARNING,
    message: 'Warning',
  },
  HEALTH_ERR: {
    state: HealthState.ERROR,
    message: 'Error',
  },
};

export const getCephHealthState: ResourceHealthHandler<WatchCephResource> = ({ ceph }) => {
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
  return CephHealthStatus[status] || { state: HealthState.UNKNOWN };
};

export const getDataResiliencyState: PrometheusHealthHandler = (responses) => {
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
    return { state: HealthState.PROGRESS, message: 'Progressing' };
  }
  return { state: HealthState.OK };
};
