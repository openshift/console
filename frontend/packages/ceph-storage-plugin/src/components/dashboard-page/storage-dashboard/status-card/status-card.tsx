import * as React from 'react';
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
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusHealthHandler } from '@console/plugin-sdk';
import DashboardCardActions from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardActions';
import AlertFilter from '@console/shared/src/components/dashboard/status-card/AlertFilter';
import {
  useFilters,
  SelectedFilters,
} from '@console/shared/src/components/dashboard/status-card/use-filter-hook';
import {
  DATA_RESILIENCY_QUERY,
  STORAGE_HEALTH_QUERIES,
  StorageDashboardQuery,
} from '../../../../constants/queries';
import { filterCephAlerts } from '../../../../selectors';
import { getCephHealthState, getDataResiliencyState } from './utils';

const cephStatusQuery = STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY];
const resiliencyProgressQuery = DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS];

const CephHealthItem = withDashboardResources<DashboardItemProps & CephHealthItemProps>(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    query,
    healthHandler,
    title,
  }) => {
    React.useEffect(() => {
      watchPrometheus(query);
      return () => stopWatchPrometheusQuery(query);
    }, [watchPrometheus, stopWatchPrometheusQuery, query]);

    const [queryResult, queryError] = getPrometheusQueryResponse(prometheusResults, query);
    const { state } = healthHandler([queryResult], [queryError]);
    return <HealthItem title={title} state={state} />;
  },
);

const CephAlerts = withDashboardResources<DashboardItemProps & CephAlertsProps>(
  ({ watchAlerts, stopWatchAlerts, alertsResults, selectedFilters, resetFilters }) => {
    React.useEffect(() => {
      watchAlerts();
      return () => {
        stopWatchAlerts();
      };
    }, [watchAlerts, stopWatchAlerts]);

    const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
    const alertsResponseError = alertsResults.getIn([ALERTS_KEY, 'loadError']);
    const alerts = filterCephAlerts(getAlerts(alertsResponse));

    return (
      <AlertsBody
        isLoading={!alertsResponse}
        error={alertsResponseError}
        emptyMessage="No persistent storage alerts"
        alerts={alerts}
        selectedFilters={selectedFilters}
        resetFilters={resetFilters}
      />
    );
  },
);

export const StatusCard: React.FC = () => {
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
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <CephHealthItem
                title="OCS Cluster"
                query={cephStatusQuery}
                healthHandler={getCephHealthState}
              />
            </GalleryItem>
            <GalleryItem>
              <CephHealthItem
                title="Data Resiliency"
                query={resiliencyProgressQuery}
                healthHandler={getDataResiliencyState}
              />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <CephAlerts selectedFilters={selectedFilters} resetFilters={resetFilters} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;

type CephHealthItemProps = {
  query: string;
  title: string;
  healthHandler: PrometheusHealthHandler;
};

type CephAlertsProps = {
  selectedFilters: SelectedFilters;
  resetFilters: () => void;
};
