import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import { EventKind, K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { EventModel } from '@console/internal/models';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/activity-card/ActivityBody';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import {
  getResiliencyProgress,
  isObjectStorageEvent,
} from '@console/ceph-storage-plugin/src/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useFlag } from '@console/dynamic-plugin-sdk/src/shared/hooks/flag';
import { RGW_FLAG } from '@console/ceph-storage-plugin/src/features';
import {
  dataResiliencyQueryMap,
  ObjectServiceDashboardQuery,
} from '../../../../queries/object-storage-queries';
import { secretResource } from '../../../../resources';
import { decodeRGWPrefix } from '../../../../utils';
import './activity-card.scss';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }: DashboardItemProps) => {
    React.useEffect(() => {
      watchK8sResource(eventsResource);
      return () => {
        stopWatchK8sResource(eventsResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);
    return (
      <RecentEventsBody
        events={resources.events as FirehoseResult<EventKind[]>}
        filter={isObjectStorageEvent}
      />
    );
  },
);

const OngoingActivity = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind>(secretResource);
    const isRGWSupported = useFlag(RGW_FLAG);
    const rgwPrefix = React.useMemo(
      () => (isRGWSupported && loaded && !loadError ? decodeRGWPrefix(data) : ''),
      [data, loaded, loadError, isRGWSupported],
    );

    const rgwResiliencyQuery = dataResiliencyQueryMap[
      ObjectServiceDashboardQuery.RGW_REBUILD_PROGRESS_QUERY
    ](rgwPrefix);

    React.useEffect(() => {
      watchPrometheus(dataResiliencyQueryMap.MCG_REBUILD_PROGRESS_QUERY);
      watchPrometheus(dataResiliencyQueryMap.MCG_REBUILD_TIME_QUERY);
      isRGWSupported && watchPrometheus(rgwResiliencyQuery);
      return () => {
        stopWatchPrometheusQuery(dataResiliencyQueryMap.MCG_REBUILD_PROGRESS_QUERY);
        stopWatchPrometheusQuery(dataResiliencyQueryMap.MCG_REBUILD_TIME_QUERY);
        isRGWSupported && stopWatchPrometheusQuery(rgwResiliencyQuery);
      };
    }, [watchPrometheus, stopWatchPrometheusQuery, isRGWSupported, rgwResiliencyQuery]);

    const progress = prometheusResults.getIn([
      dataResiliencyQueryMap.MCG_REBUILD_PROGRESS_QUERY,
      'data',
    ]) as PrometheusResponse;
    const progressError = prometheusResults.getIn([
      dataResiliencyQueryMap.MCG_REBUILD_PROGRESS_QUERY,
      'loadError',
    ]);

    const eta = prometheusResults.getIn([
      dataResiliencyQueryMap.MCG_REBUILD_TIME_QUERY,
      'data',
    ]) as PrometheusResponse;

    const rgwProgress = prometheusResults.getIn([rgwResiliencyQuery, 'data']) as PrometheusResponse;

    const rgwProgressError = prometheusResults.getIn([rgwResiliencyQuery, 'loadError']);

    const prometheusActivities = [];

    if (getResiliencyProgress(progress) < 1) {
      prometheusActivities.push({
        results: [progress, eta],
        loader: () =>
          import('./data-resiliency-activity/data-resiliency-activity').then(
            (m) => m.NoobaaDataResiliency,
          ),
      });
    }

    if (isRGWSupported && getResiliencyProgress(rgwProgress) < 1) {
      prometheusActivities.push({
        results: [rgwProgress],
        loader: () =>
          import('./data-resiliency-activity/data-resiliency-activity').then(
            (m) => m.NoobaaDataResiliency,
          ),
      });
    }

    return (
      <OngoingActivityBody
        loaded={
          (progress || progressError) && (isRGWSupported ? rgwProgress || rgwProgressError : true)
        }
        prometheusActivities={prometheusActivities}
      />
    );
  },
);

const ActivityCard: React.FC<{}> = () => {
  const { t } = useTranslation();

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Activity')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody className="nb-activity-card__body">
          <OngoingActivity />
          <RecentEvent />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default ActivityCard;
