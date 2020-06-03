import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { alertURL } from '@console/internal/components/monitoring';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { getDataResiliencyState } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/status-card/utils';
import { filterNooBaaAlerts } from '../../utils';
import { DATA_RESILIENCE_QUERIES, StatusCardQueries } from '../../queries';
import { NooBaaSystemModel } from '../../models';
import { getNooBaaState, ObjectServiceState } from './statuses';
import './status-card.scss';

const statusCardQueries = Object.keys(StatusCardQueries);

const noobaaResource: FirehoseResource = {
  kind: referenceForModel(NooBaaSystemModel),
  isList: true,
  prop: 'noobaa',
};

const NooBaaAlerts = withDashboardResources(
  ({ watchAlerts, stopWatchAlerts, notificationAlerts }) => {
    React.useEffect(() => {
      watchAlerts();
      return () => {
        stopWatchAlerts();
      };
    }, [watchAlerts, stopWatchAlerts]);

    const { data, loaded, loadError } = notificationAlerts || {};
    const alerts = filterNooBaaAlerts(data);

    return (
      <AlertsBody error={!_.isEmpty(loadError)}>
        {loaded &&
          alerts.length > 0 &&
          alerts.map((alert) => <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />)}
      </AlertsBody>
    );
  },
);

const StatusCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  watchPrometheus,
  resources,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    watchK8sResource(noobaaResource);
    statusCardQueries.forEach((key) => watchPrometheus(StatusCardQueries[key]));
    watchPrometheus(DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY);
    return () => {
      stopWatchK8sResource(noobaaResource);
      statusCardQueries.forEach((key) => stopWatchPrometheusQuery(StatusCardQueries[key]));
      stopWatchPrometheusQuery(DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY);
    };
  }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

  const buckets = prometheusResults.getIn([
    StatusCardQueries.BUCKETS_COUNT,
    'data',
  ]) as PrometheusResponse;

  const unhealthyBuckets = prometheusResults.getIn([
    StatusCardQueries.UNHEALTHY_BUCKETS,
    'data',
  ]) as PrometheusResponse;

  const pools = prometheusResults.getIn([
    StatusCardQueries.POOLS_COUNT,
    'data',
  ]) as PrometheusResponse;

  const unhealthyPools = prometheusResults.getIn([
    StatusCardQueries.UNHEALTHY_POOLS,
    'data',
  ]) as PrometheusResponse;

  const progressResult = prometheusResults.getIn([
    DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
    'data',
  ]) as PrometheusResponse;
  const progressError = prometheusResults.getIn([
    DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
    'loadError',
  ]);

  const noobaa = _.get(resources, 'noobaa') as FirehoseResult;

  const queriesLoadError = statusCardQueries.some((q) => {
    return prometheusResults.getIn([StatusCardQueries[q], 'loadError']);
  });

  const hasStatusLoadError = _.get(noobaa, 'loadError') || queriesLoadError;
  const allStatusLoaded =
    _.get(noobaa, 'loaded') && buckets && unhealthyBuckets && pools && unhealthyPools;

  const objectServiceState: ObjectServiceState = getNooBaaState(
    [buckets, unhealthyBuckets, pools, unhealthyPools],
    !!hasStatusLoadError,
    !allStatusLoaded,
    noobaa,
  );

  const dataResiliencyState: ObjectServiceState = getDataResiliencyState([
    { response: progressResult, error: progressError },
  ]);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="nb-status-card__health" hasGutter>
            <GalleryItem>
              <HealthItem
                title="Multi Cloud Object Gateway"
                state={objectServiceState.state}
                details={objectServiceState.message}
              />
            </GalleryItem>
            <GalleryItem>
              <HealthItem
                title="Data Resiliency"
                state={dataResiliencyState.state}
                details={dataResiliencyState.message}
              />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <NooBaaAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(StatusCard);
