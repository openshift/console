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
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getGaugeValue, filterNooBaaAlerts } from '../../utils';
import { HealthCardQueries } from '../../queries';
import { NooBaaSystemModel } from '../../models';

const noobaaSystemResource: FirehoseResource = {
  kind: referenceForModel(NooBaaSystemModel),
  isList: true,
  prop: 'noobaa',
};

const getObjectStorageHealthState = (
  bucketsResponse: PrometheusResponse,
  unhealthyBucketsResponse: PrometheusResponse,
  poolsResponse: PrometheusResponse,
  unhealthyPoolResponse: PrometheusResponse,
  noobaaSystem: FirehoseResult,
  queryError: boolean,
): ObjectStorageHealth => {
  const loadError = _.get(noobaaSystem, 'loadError');
  const loaded = _.get(noobaaSystem, 'loaded');
  const noobaaSystemData = _.get(noobaaSystem, 'data[0]', null) as K8sResourceKind;
  const noobaaPhase = _.get(noobaaSystemData, 'status.phase');

  const buckets = getGaugeValue(bucketsResponse);
  const unhealthyBuckets = getGaugeValue(unhealthyBucketsResponse);
  const pools = getGaugeValue(poolsResponse);
  const unhealthyPools = getGaugeValue(unhealthyPoolResponse);

  const result: ObjectStorageHealth = {
    message: 'Object Storage is healthy',
    state: HealthState.OK,
  };

  if (
    !queryError &&
    !(
      (loaded || loadError) &&
      bucketsResponse &&
      unhealthyBucketsResponse &&
      poolsResponse &&
      unhealthyPoolResponse
    )
  ) {
    return { state: HealthState.LOADING };
  }
  if (queryError || loadError || !(buckets && unhealthyBuckets && pools && unhealthyPools)) {
    return { message: null };
  }
  if (!noobaaSystemData || noobaaPhase !== 'Ready') {
    result.message = 'Multi cloud gateway is not running';
    result.state = HealthState.ERROR;
    return result;
  }
  if (!_.isNil(pools) && !_.isNil(unhealthyPools)) {
    if (Number(pools) === Number(unhealthyPools)) {
      result.message = 'All resources are unhealthy';
      result.state = HealthState.ERROR;
      return result;
    }
  }
  if (!_.isNil(buckets) && !_.isNil(unhealthyBuckets)) {
    const value = Number(unhealthyBuckets) / Number(buckets);
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

  const bucketsQueryResult = prometheusResults.getIn([
    HealthCardQueries.BUCKETS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const bucketsQueryResultError = prometheusResults.getIn([
    HealthCardQueries.BUCKETS_COUNT,
    'loadError',
  ]);

  const unhealthyBucketsQueryResult = prometheusResults.getIn([
    HealthCardQueries.UNHEALTHY_BUCKETS,
    'data',
  ]) as PrometheusResponse;
  const unhealthyBucketsQueryResultError = prometheusResults.getIn([
    HealthCardQueries.UNHEALTHY_BUCKETS,
    'loadError',
  ]);

  const poolsQueryResult = prometheusResults.getIn([
    HealthCardQueries.POOLS_COUNT,
    'data',
  ]) as PrometheusResponse;
  const poolsQueryResultError = prometheusResults.getIn([
    HealthCardQueries.POOLS_COUNT,
    'loadError',
  ]);

  const unhealthyPoolsQueryResult = prometheusResults.getIn([
    HealthCardQueries.UNHEALTHY_POOLS,
    'data',
  ]) as PrometheusResponse;
  const unhealthyPoolsQueryResultError = prometheusResults.getIn([
    HealthCardQueries.UNHEALTHY_POOLS,
    'loadError',
  ]);

  const error =
    bucketsQueryResultError ||
    unhealthyBucketsQueryResultError ||
    poolsQueryResultError ||
    unhealthyPoolsQueryResultError;
  const noobaaSystem = _.get(resources, 'noobaa') as FirehoseResult;

  const objectServiceHealthState = getObjectStorageHealthState(
    bucketsQueryResult,
    unhealthyBucketsQueryResult,
    poolsQueryResult,
    unhealthyPoolsQueryResult,
    noobaaSystem,
    error,
  );
  const alerts = filterNooBaaAlerts(getAlerts(alertsResults));

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Health</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={objectServiceHealthState.state === HealthState.LOADING}>
        <HealthBody>
          {objectServiceHealthState.message ? (
            <HealthItem
              state={objectServiceHealthState.state}
              message={objectServiceHealthState.message}
            />
          ) : (
            <span className="text-muted">Unavailable</span>
          )}
        </HealthBody>
      </DashboardCardBody>
      {alerts.length > 0 && (
        <React.Fragment>
          <DashboardCardHeader className="co-health-card__alerts-border">
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
  state?: HealthState;
  message?: string;
};
