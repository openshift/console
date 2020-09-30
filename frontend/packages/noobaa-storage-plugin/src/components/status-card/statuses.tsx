import { PrometheusHealthHandler, SubsystemHealth } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getGaugeValue } from '../../utils';
import { Phase } from '../../constants';

const nooBaaStatus = {
  '0': { state: HealthState.OK },
  '1': {
    state: HealthState.ERROR,
    message: 'All resources are unhealthy',
  },
  '2': {
    state: HealthState.WARNING,
    message: 'Object Bucket has an issue',
  },
  '3': {
    state: HealthState.ERROR,
    message: 'Many buckets have issues',
  },
  '4': {
    state: HealthState.WARNING,
    message: 'Some buckets have issues',
  },
};

export const getNooBaaState: PrometheusHealthHandler = (responses, noobaa) => {
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
  return (
    nooBaaStatus[statusIndex] || {
      state: HealthState.UNKNOWN,
    }
  );
};

export const getRGWHealthState = (cr: K8sResourceKind): SubsystemHealth => {
  const health = cr?.status?.phase;
  if (!health) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  switch (health) {
    case Phase.CONNECTED:
      return { state: HealthState.OK };
    case Phase.PROGRESSING:
      return { state: HealthState.PROGRESS };
    case Phase.FAILURE:
      return { state: HealthState.ERROR };
    default:
      return { state: HealthState.UNKNOWN };
  }
};
