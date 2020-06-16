import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { SubsystemHealth } from '@console/plugin-sdk';
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
import { StatusCardQueries } from '../../queries';
import { NooBaaSystemModel } from '../../models';
import { getNooBaaState } from './statuses';
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
    return () => {
      stopWatchK8sResource(noobaaResource);
      statusCardQueries.forEach((key) => stopWatchPrometheusQuery(StatusCardQueries[key]));
    };
  }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

  const healthStatusResult = prometheusResults.getIn([
    StatusCardQueries.HEALTH_QUERY,
    'data',
  ]) as PrometheusResponse;

  const progressResult = prometheusResults.getIn([
    StatusCardQueries.REBUILD_PROGRESS_QUERY,
    'data',
  ]) as PrometheusResponse;

  const healthStatusError = prometheusResults.getIn([
    StatusCardQueries.HEALTH_QUERY,
    'loadError',
  ]) as PrometheusResponse;

  const progressError = prometheusResults.getIn([
    StatusCardQueries.REBUILD_PROGRESS_QUERY,
    'loadError',
  ]);

  const noobaa = _.get(resources, 'noobaa') as FirehoseResult;

  const objectServiceState: SubsystemHealth = getNooBaaState(
    [{ response: healthStatusResult, error: healthStatusError }],
    noobaa,
  );

  const dataResiliencyState: SubsystemHealth = getDataResiliencyState([
    { response: progressResult, error: progressError },
  ]);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="nb-status-card__health" gutter="md">
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
