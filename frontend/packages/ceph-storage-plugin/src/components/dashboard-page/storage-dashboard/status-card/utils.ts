import { PrometheusHealthHandler, ResourceHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { getGaugeValue } from '../../../../utils';
import { WatchCephResource } from '../../../../types';

const CephHealthStatus = {
  HEALTH_OK: {
    state: HealthState.OK,
  },
  HEALTH_WARN: {
    state: HealthState.WARNING,
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
  const progress = getGaugeValue(responses[0].response);
  const formattedProgress = parseFloat(progress);
  if (responses[0].error || !progress) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (!responses[0].response) {
    return { state: HealthState.LOADING };
  }
  if (Number.isNaN(formattedProgress)) {
    return { state: HealthState.UNKNOWN };
  }
  if (formattedProgress < 1) {
    return { state: HealthState.PROGRESS, message: 'Progressing' };
  }
  return { state: HealthState.OK };
};
