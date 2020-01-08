import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { ALERTS_KEY, getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import { PrometheusRulesResponse } from '@console/internal/components/monitoring';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { getAlerts } from '@console/shared/src/components/dashboard/status-card/utils';
import DashboardCardActions from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardActions';
import AlertFilter from '@console/shared/src/components/dashboard/status-card/AlertFilter';
import {
  useFilters,
  SelectedFilters,
} from '@console/shared/src/components/dashboard/status-card/use-filter-hook';
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

const MultiCloudHealth = withDashboardResources(
  ({
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
      return () => {
        stopWatchK8sResource(noobaaResource);
        statusCardQueries.forEach((key) => stopWatchPrometheusQuery(StatusCardQueries[key]));
      };
    }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

    const [buckets, bucketsError] = getPrometheusQueryResponse(
      prometheusResults,
      StatusCardQueries.BUCKETS_COUNT,
    );

    const [unhealthyBuckets, unhealthyBucketsError] = getPrometheusQueryResponse(
      prometheusResults,
      StatusCardQueries.UNHEALTHY_BUCKETS,
    );

    const [pools, poolsError] = getPrometheusQueryResponse(
      prometheusResults,
      StatusCardQueries.POOLS_COUNT,
    );

    const [unhealthyPools, unhealthyPoolsError] = getPrometheusQueryResponse(
      prometheusResults,
      StatusCardQueries.UNHEALTHY_POOLS,
    );

    const noobaa = _.get(resources, 'noobaa') as FirehoseResult;

    const queriesLoadError =
      !!bucketsError || !!unhealthyBucketsError || !!poolsError || !!unhealthyPoolsError;

    const hasStatusLoadError = _.get(noobaa, 'loadError') || queriesLoadError;
    const allStatusLoaded =
      _.get(noobaa, 'loaded') && buckets && unhealthyBuckets && pools && unhealthyPools;

    const objectServiceState: ObjectServiceState = getNooBaaState(
      [buckets, unhealthyBuckets, pools, unhealthyPools],
      !!hasStatusLoadError,
      !allStatusLoaded,
      noobaa,
    );

    return (
      <HealthItem
        title="Multi Cloud Object Gateway"
        state={objectServiceState.state}
        details={objectServiceState.message}
      />
    );
  },
);

const DataResiliencyHealth = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }) => {
    React.useEffect(() => {
      watchPrometheus(DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY);
      return () => {
        stopWatchPrometheusQuery(DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY);
      };
    }, [watchPrometheus, stopWatchPrometheusQuery]);

    const progressResult = prometheusResults.getIn([
      DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
      'data',
    ]) as PrometheusResponse;
    const progressError = prometheusResults.getIn([
      DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
      'loadError',
    ]);
    const { state }: ObjectServiceState = getDataResiliencyState([progressResult], [progressError]);

    return <HealthItem title="Data Resiliency" state={state} />;
  },
);

const NooBaaAlerts = withDashboardResources<DashboardItemProps & NooBaaAlertsProps>(
  ({ watchAlerts, stopWatchAlerts, alertsResults, selectedFilters, resetFilters }) => {
    React.useEffect(() => {
      watchAlerts();
      return () => {
        stopWatchAlerts();
      };
    }, [watchAlerts, stopWatchAlerts]);

    const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
    const alertsResponseError = alertsResults.getIn([ALERTS_KEY, 'loadError']);
    const alerts = filterNooBaaAlerts(getAlerts(alertsResponse));

    return (
      <AlertsBody
        isLoading={!alertsResponse}
        error={alertsResponseError}
        emptyMessage="No object service alerts"
        alerts={alerts}
        selectedFilters={selectedFilters}
        resetFilters={resetFilters}
      />
    );
  },
);

const StatusCard: React.FC = () => {
  const [filters, selectedFilters, resetFilters, toggleFilter] = useFilters();
  return (
    <DashboardCard gradient>
      <DashboardCardHeader compact>
        <DashboardCardTitle>Status</DashboardCardTitle>
        <DashboardCardActions>
          <AlertFilter
            filters={filters}
            selectedFilters={selectedFilters}
            toggleFilter={toggleFilter}
          />
        </DashboardCardActions>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="nb-status-card__health" gutter="md">
            <GalleryItem>
              <MultiCloudHealth />
            </GalleryItem>
            <GalleryItem>
              <DataResiliencyHealth />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <NooBaaAlerts selectedFilters={selectedFilters} resetFilters={resetFilters} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;

type NooBaaAlertsProps = {
  selectedFilters: SelectedFilters;
  resetFilters: () => void;
};
