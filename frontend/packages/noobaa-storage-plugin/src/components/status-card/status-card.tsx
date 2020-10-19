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
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { getDataResiliencyState } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/status-card/utils';
import { CephObjectStoreModel } from '@console/ceph-storage-plugin/src/models';
import { RGW_FLAG } from '@console/ceph-storage-plugin/src/features';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { filterNooBaaAlerts, filterRGWAlerts, decodeRGWPrefix } from '../../utils';
import {
  StatusCardQueries,
  dataResiliencyQueryMap,
  ObjectServiceDashboardQuery,
} from '../../queries';
import { NooBaaSystemModel } from '../../models';
import { getNooBaaState, getRGWHealthState } from './statuses';
import { ObjectServiceStatus } from './object-service-health';
import { StatusType, secretResource } from '../../constants';
import './status-card.scss';

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

const ObjectStorageAlerts = withDashboardResources(
  ({ watchAlerts, stopWatchAlerts, notificationAlerts }) => {
    React.useEffect(() => {
      watchAlerts();
      return () => {
        stopWatchAlerts();
      };
    }, [watchAlerts, stopWatchAlerts]);

    const { data, loaded, loadError } = notificationAlerts || {};
    const alerts = [...filterNooBaaAlerts(data), ...filterRGWAlerts(data)];

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
  const isRGWSupported = useFlag(RGW_FLAG);

  const [secretData, secretLoaded, secretLoadError] = useK8sWatchResource<K8sResourceKind>(
    secretResource,
  );
  const rgwPrefix = React.useMemo(
    () => (isRGWSupported && secretLoaded && !secretLoadError ? decodeRGWPrefix(secretData) : ''),
    [secretData, secretLoaded, secretLoadError, isRGWSupported],
  );

  const rgwResiliencyQuery = dataResiliencyQueryMap[
    ObjectServiceDashboardQuery.RGW_REBUILD_PROGRESS_QUERY
  ](rgwPrefix);

  React.useEffect(() => {
    watchK8sResource(noobaaResource);
    watchK8sResource(cephObjectStoreResource);
    statusCardQueries.forEach((key) => watchPrometheus(StatusCardQueries[key]));
    isRGWSupported && watchPrometheus(rgwResiliencyQuery);
    return () => {
      stopWatchK8sResource(noobaaResource);
      stopWatchK8sResource(cephObjectStoreResource);
      statusCardQueries.forEach((key) => stopWatchPrometheusQuery(StatusCardQueries[key]));
      isRGWSupported && stopWatchPrometheusQuery(rgwResiliencyQuery);
    };
  }, [
    watchK8sResource,
    stopWatchK8sResource,
    watchPrometheus,
    stopWatchPrometheusQuery,
    rgwResiliencyQuery,
    isRGWSupported,
  ]);

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
    rgwResiliencyQuery,
    'data',
  ]) as PrometheusResponse;

  const rgwResiliencyError = prometheusResults.getIn([rgwResiliencyQuery, 'loadError']);

  const noobaa = _.get(resources, 'noobaa') as FirehoseResult;
  const rgw = resources?.rgw?.data?.[0];

  const MCGState = getNooBaaState(
    [{ response: healthStatusResult, error: healthStatusError }],
    noobaa,
  );

  const RGWState = getRGWHealthState(rgw);

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
                RGWMetrics={isRGWSupported ? RGWState : undefined}
                MCGMetrics={MCGState}
                statusType={StatusType.HEALTH}
              />
            </GalleryItem>
            <GalleryItem>
              <ObjectServiceStatus
                RGWMetrics={isRGWSupported ? RGWResiliencyState : undefined}
                MCGMetrics={dataResiliencyState}
                statusType={StatusType.RESILIENCY}
              />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <ObjectStorageAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(StatusCard);
