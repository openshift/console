import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { EventKind, K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { EventModel, StatefulSetModel, PodModel } from '@console/internal/models';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getResiliencyProgress } from '@console/ceph-storage-plugin/src/utils';
import { CephObjectStoreModel } from '@console/ceph-storage-plugin/src/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useFlag } from '@console/shared/src/hooks/flag';
import { RGW_FLAG } from '@console/ceph-storage-plugin/src/features';
import { dataResiliencyQueryMap, ObjectServiceDashboardQuery } from '../../queries';
import {
  NooBaaBackingStoreModel,
  NooBaaBucketClassModel,
  NooBaaObjectBucketClaimModel,
} from '../../models';
import { secretResource } from '../../constants';
import { decodeRGWPrefix } from '../../utils';
import './activity-card.scss';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const isObjectStorageEvent = (event: EventKind): boolean => {
  const eventName: string = event?.involvedObject?.name;
  return _.startsWith(eventName, 'noobaa') || eventName.includes('rgw');
};

const objectStorageEventsFilter = (event: EventKind): boolean => {
  const eventKind: string = event?.involvedObject?.kind;
  const objectStorageResources = [
    NooBaaBackingStoreModel.kind,
    NooBaaBucketClassModel.kind,
    NooBaaObjectBucketClaimModel.kind,
    CephObjectStoreModel.kind,
  ];
  if (eventKind === PodModel.kind || eventKind === StatefulSetModel.kind) {
    return isObjectStorageEvent(event);
  }
  return objectStorageResources.includes(eventKind);
};

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
        filter={objectStorageEventsFilter}
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

const ActivityCard: React.FC<{}> = () => (
  <DashboardCard gradient>
    <DashboardCardHeader>
      <DashboardCardTitle>Activity</DashboardCardTitle>
    </DashboardCardHeader>
    <DashboardCardBody>
      <ActivityBody className="nb-activity-card__body">
        <OngoingActivity />
        <RecentEvent />
      </ActivityBody>
    </DashboardCardBody>
  </DashboardCard>
);

export default ActivityCard;
