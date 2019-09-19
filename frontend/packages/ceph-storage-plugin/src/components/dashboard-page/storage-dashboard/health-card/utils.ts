import * as _ from 'lodash';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { getName } from '@console/shared/src/selectors/common';
import { FirehoseResult } from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { CEPH_HEALTHY, CEPH_DEGRADED, CEPH_ERROR, CEPH_UNKNOWN } from '../../../../constants';

const CephHealthStatus = [
  {
    message: CEPH_HEALTHY,
    state: HealthState.OK,
  },
  {
    message: CEPH_DEGRADED,
    state: HealthState.WARNING,
  },
  {
    message: CEPH_ERROR,
    state: HealthState.ERROR,
  },
  {
    message: CEPH_UNKNOWN,
    state: HealthState.ERROR,
  },
];

export const getCephHealthState = (
  ocsResponse: PrometheusResponse,
  error: boolean,
  cephCluster: FirehoseResult,
): CephHealth => {
  if ((!ocsResponse && !error) || !_.get(cephCluster, 'loaded')) {
    return { state: HealthState.LOADING };
  }

  const cephClusterData = _.get(cephCluster, 'data') as FirehoseResult['data'];
  const cephClusterName = getName(_.get(cephClusterData, 0));
  const value = _.get(ocsResponse, 'data.result[0].value[1]');
  const cephHealth = error ? CephHealthStatus[3] : CephHealthStatus[value] || CephHealthStatus[3];

  if (!cephClusterName) {
    return { ...cephHealth, message: `Openshift Storage ${cephHealth.message}` };
  }
  return { ...cephHealth, message: `${cephClusterName} ${cephHealth.message}` };
};

type CephHealth = {
  state: HealthState;
  message?: string;
};
