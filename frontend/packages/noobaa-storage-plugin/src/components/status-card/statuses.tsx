import * as _ from 'lodash';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { FirehoseResult } from '@console/internal/components/utils';
import { getGaugeValue } from '../../utils';

const NooBaaStatus = [
  {
    state: HealthState.ERROR,
    message: 'MCG is not running',
  },
  {
    state: HealthState.ERROR,
    message: 'All resources are unhealthy',
  },
  {
    state: HealthState.WARNING,
    message: 'Object Bucket has an issue',
  },
  {
    state: HealthState.ERROR,
    message: 'Many buckets have issues',
  },
  {
    state: HealthState.WARNING,
    message: 'Some buckets have issues',
  },
];

export const getNooBaaState: GetObjectServiceStatus = (
  prometheusResponses = [],
  hasLoadError,
  isLoading,
  k8sResponse,
) => {
  const [buckets, unhealthyBuckets, pools, unhealthyPools] = prometheusResponses.map((r) =>
    getGaugeValue(r),
  );
  const noobaaPhase = _.get(k8sResponse, 'data[0].status.phase');
  const unhealthyBucketsRatio = unhealthyBuckets / buckets;
  const noData = !(buckets && unhealthyBuckets && pools && unhealthyPools && noobaaPhase);

  if (hasLoadError) {
    return { state: HealthState.UNKNOWN };
  }
  if (noData) {
    return { state: HealthState.NOT_AVAILABLE };
  }
  if (isLoading) {
    return { state: HealthState.LOADING };
  }
  if (noobaaPhase !== 'Ready') {
    return NooBaaStatus[0];
  }
  if (Number(pools) === Number(unhealthyPools)) {
    return NooBaaStatus[1];
  }
  if (Number(unhealthyBuckets) === 1) {
    return NooBaaStatus[2];
  }
  if (unhealthyBucketsRatio >= 0.5) {
    return NooBaaStatus[3];
  }
  if (unhealthyBucketsRatio >= 0.3) {
    return NooBaaStatus[4];
  }
  return { state: HealthState.OK };
};

export type ObjectServiceState = { state: HealthState; message?: string };

type GetObjectServiceStatus = (
  prometheusResponses: PrometheusResponse[],
  hasLoadError: boolean,
  isLoading: boolean,
  k8sResponse?: FirehoseResult,
) => ObjectServiceState;
