import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { SubsystemHealth } from '@console/plugin-sdk';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { alertURL } from '@console/internal/components/monitoring/utils';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { getDataResiliencyState } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/status-card/utils';
import { CephObjectStoreModel } from '@console/ceph-storage-plugin/src/models';
import { RGW_FLAG, OCS_INDEPENDENT_FLAG } from '@console/ceph-storage-plugin/src/features';
import { useFlag } from '@console/shared/src/hooks/flag';
import { filterNooBaaAlerts } from '../../utils';
import { StatusCardQueries } from '../../queries';
import { NooBaaSystemModel } from '../../models';
import { getNooBaaState, getRGWHealthState } from './statuses';
import { ObjectServiceStatus } from './object-service-health';
import { StatusType } from '../../constants';
import './status-card.scss';
import { MODES } from '@console/ceph-storage-plugin/src/constants';

const statusCardQueries = Object.keys(StatusCardQueries);

const noobaaResource: FirehoseResource = {
  kind: referenceForModel(NooBaaSystemModel),
  isList: true,
  prop: 'noobaa',
};

const cephObjectStoreResource: FirehoseResource = {
  kind: referenceForModel(CephObjectStoreModel),
  isList: true,
  prop: 'rgw',
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
  const RGW = useFlag(RGW_FLAG);
  React.useEffect(() => {
    watchK8sResource(noobaaResource);
    watchK8sResource(cephObjectStoreResource);
    statusCardQueries.forEach((key) => watchPrometheus(StatusCardQueries[key]));
    return () => {
      stopWatchK8sResource(noobaaResource);
      stopWatchK8sResource(cephObjectStoreResource);
      statusCardQueries.forEach((key) => stopWatchPrometheusQuery(StatusCardQueries[key]));
    };
  }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

  const isExternal = useFlag(OCS_INDEPENDENT_FLAG);
  const MODE = isExternal ? MODES.EXTERNAL : MODES.INTERNAL;

  const healthStatusResult = prometheusResults.getIn([
    StatusCardQueries.HEALTH_QUERY,
    'data',
  ]) as PrometheusResponse;

  const progressResult = prometheusResults.getIn([
    StatusCardQueries.MCG_REBUILD_PROGRESS_QUERY,
    'data',
  ]) as PrometheusResponse;

  const healthStatusError = prometheusResults.getIn([
    StatusCardQueries.HEALTH_QUERY,
    'loadError',
  ]) as PrometheusResponse;

  const progressError = prometheusResults.getIn([
    StatusCardQueries.MCG_REBUILD_PROGRESS_QUERY,
    'loadError',
  ]);

  const rgwResiliencyResult = prometheusResults.getIn([
    StatusCardQueries.RGW_RESILIENCY_QUERY,
    'data',
  ]) as PrometheusResponse;

  const rgwResiliencyError = prometheusResults.getIn([
    StatusCardQueries.MCG_REBUILD_PROGRESS_QUERY,
    'loadError',
  ]);

  const noobaa = _.get(resources, 'noobaa') as FirehoseResult;
  const rgw = resources?.rgw?.data?.[0];

  const MCGState = getNooBaaState(
    [{ response: healthStatusResult, error: healthStatusError }],
    noobaa,
  );

  const RGWState = getRGWHealthState(rgw, MODE);

  const dataResiliencyState: SubsystemHealth = getDataResiliencyState([
    { response: progressResult, error: progressError },
  ]);

  const RGWResiliencyState = getDataResiliencyState([
    { response: rgwResiliencyResult, error: rgwResiliencyError },
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
              <ObjectServiceStatus
                RGWMetrics={RGW ? RGWState : undefined}
                MCGMetrics={MCGState}
                statusType={StatusType.HEALTH}
              />
            </GalleryItem>
            <GalleryItem>
              <ObjectServiceStatus
                RGWMetrics={RGW ? RGWResiliencyState : undefined}
                MCGMetrics={dataResiliencyState}
                statusType={StatusType.RESILIENCY}
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
