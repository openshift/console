import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { getName } from '@console/shared/src/selectors/common';
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

export const getCephHealthState = (ocsResponse, cephCluster): CephHealth => {
  if (!ocsResponse || !_.get(cephCluster, 'loaded')) {
    return { state: HealthState.LOADING };
  }
  const value = _.get(ocsResponse, 'data.result[0].value[1]');
  const cephClusterData = _.get(cephCluster, 'data') as K8sResourceKind[];
  const cephClusterName = getName(_.get(cephClusterData, 0));
  const cephHealth = CephHealthStatus[value] || CephHealthStatus[3];
  if (!cephClusterName) {
    return { ...cephHealth, message: `Openshift Storage ${cephHealth.message}` };
  }
  return { ...cephHealth, message: `${cephClusterName} ${cephHealth.message}` };
};

type CephHealth = {
  state: HealthState;
  message?: string;
};
