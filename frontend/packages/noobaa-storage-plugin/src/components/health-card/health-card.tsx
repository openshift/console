import * as React from 'react';
import * as _ from 'lodash';

import {
  AlertsBody,
  AlertItem,
  getAlerts,
  HealthBody,
  HealthItem,
} from '@console/internal/components/dashboard/health-card';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import { FirehoseResource } from '@console/internal/components/utils';

import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';

import { HealthCardQueries } from '../../queries';
import { NooBaaSystemModel } from '../../models';
import { getPropsData, filterNooBaaAlerts } from '../../utils';

const noobaaSystemResource: FirehoseResource = {
  kind: referenceForModel(NooBaaSystemModel),
  namespaced: true,
  namespace: 'openshift-storage',
  name: 'noobaa-system',
  isList: false,
  prop: 'noobaa',
};

const getObjectStorageHealthState = (
  bucketsResponse,
  unhealthyBucketsResponse,
  poolsResponse,
  unhealthyPoolResponse,
  noobaaSystemData,
): ObjectStorageHealth => {
  if (
    !(
      noobaaSystemData &&
      bucketsResponse &&
      unhealthyBucketsResponse &&
      poolsResponse &&
      unhealthyPoolResponse
    )
  ) {
    return { state: HealthState.LOADING };
  }
  const buckets = getPropsData(bucketsResponse);
  const unhealthyBuckets = getPropsData(unhealthyBucketsResponse);
  const pools = _.get(poolsResponse, 'data.result[0].value[1]');
  const unhealthyPools = _.get(unhealthyPoolResponse, 'data.result[0].value[1]');
  const result: ObjectStorageHealth = {
    message: 'Object Storage is healthy',
    state: HealthState.OK,
  };
  let value;
  if (_.isEmpty(noobaaSystemData)) {
    result.message = 'Multi cloud gateway is not running';
    result.state = HealthState.ERROR;
    return result;
  }
  if (!_.isNil(poolsResponse) && !_.isNil(unhealthyPoolResponse)) {
    if (Number(pools) === Number(unhealthyPools)) {
      result.message = 'All resources are unhealthy';
      result.state = HealthState.ERROR;
      return result;
    }
  }
  if (!_.isNil(buckets) && !_.isNil(unhealthyBuckets)) {
    value = Number((Number(unhealthyBuckets) / Number(buckets)).toFixed(1));
    if (value >= 0.5) {
      result.message = 'Many buckets have issues';
      result.state = HealthState.ERROR;
      return result;
    }
    if (value >= 0.3) {
      result.message = 'Some buckets have issues';
      result.state = HealthState.WARNING;
    }
  }
  return result;
};

const HealthCard: React.FC<DashboardItemProps> = ({
  alertsResults,
  watchPrometheus,
  watchAlerts,
  watchK8sResource,
  stopWatchAlerts,
  stopWatchK8sResource,
  stopWatchPrometheusQuery,
  prometheusResults,
  resources,
}) => {
  React.useEffect(() => {
    watchK8sResource(noobaaSystemResource);
    Object.keys(HealthCardQueries).forEach((key) => watchPrometheus(HealthCardQueries[key]));
    return () => {
      stopWatchK8sResource(noobaaSystemResource);
      Object.keys(HealthCardQueries).forEach((key) =>
        stopWatchPrometheusQuery(HealthCardQueries[key]),
      );
    };
  }, [
    watchK8sResource,
    stopWatchK8sResource,
    watchPrometheus,
    stopWatchPrometheusQuery,
    watchAlerts,
    stopWatchAlerts,
  ]);

  const bucketsQueryResult = prometheusResults.getIn([HealthCardQueries.BUCKETS_COUNT, 'result']);
  const unhealthyBucketsQueryResult = prometheusResults.getIn([
    HealthCardQueries.UNHEALTHY_BUCKETS,
    'result',
  ]);
  const poolsQueryResult = prometheusResults.getIn([HealthCardQueries.POOLS_COUNT, 'result']);
  const unhealthyPoolsQueryResult = prometheusResults.getIn([
    HealthCardQueries.UNHEALTHY_POOLS,
    'result',
  ]);

  const noobaaSystem = _.get(resources, 'noobaa');
  const noobaaSystemData = _.get(noobaaSystem, 'data') as K8sResourceKind;

  const objectServiceHealthState = getObjectStorageHealthState(
    bucketsQueryResult,
    unhealthyBucketsQueryResult,
    poolsQueryResult,
    unhealthyPoolsQueryResult,
    noobaaSystemData,
  );
  const alerts = filterNooBaaAlerts(getAlerts(alertsResults));

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Health</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={objectServiceHealthState.state === HealthState.LOADING}>
        <HealthBody>
          <HealthItem
            state={objectServiceHealthState.state}
            message={objectServiceHealthState.message}
          />
        </HealthBody>
      </DashboardCardBody>
      {alerts.length > 0 && (
        <React.Fragment>
          <DashboardCardHeader className="co-alerts-card__border">
            <DashboardCardTitle>Alerts</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardBody>
            <AlertsBody>
              {alerts.map((alert) => (
                <AlertItem key={alert.fingerprint} alert={alert} />
              ))}
            </AlertsBody>
          </DashboardCardBody>
        </React.Fragment>
      )}
    </DashboardCard>
  );
};

export default withDashboardResources(HealthCard);

type ObjectStorageHealth = {
  state: HealthState;
  message?: string;
};
