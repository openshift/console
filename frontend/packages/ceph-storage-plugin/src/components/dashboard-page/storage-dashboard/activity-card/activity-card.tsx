import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { EventKind } from '@console/internal/module/k8s';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import {
  EventModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
} from '@console/internal/models';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getNamespace } from '@console/shared';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { CEPH_STORAGE_NAMESPACE } from '../../../../constants/index';
import { DATA_RESILIENCY_QUERY, StorageDashboardQuery } from '../../../../constants/queries';
import { getResiliencyProgress } from '../../../../utils';
import './activity-card.scss';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const ocsEventNamespaceKindFilter = (event: EventKind): boolean =>
  getNamespace(event) === CEPH_STORAGE_NAMESPACE ||
  _.get(event, 'involvedObject.kind') ===
    (PersistentVolumeClaimModel.kind || PersistentVolumeModel.kind);

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
        filter={ocsEventNamespaceKindFilter}
      />
    );
  },
);

const OngoingActivity = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    React.useEffect(() => {
      watchPrometheus(DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS]);
      return () =>
        stopWatchPrometheusQuery(DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS]);
    }, [watchPrometheus, stopWatchPrometheusQuery]);

    const progressResponse = prometheusResults.getIn([
      DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS],
      'data',
    ]) as PrometheusResponse;
    const progressError = prometheusResults.getIn([
      DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS],
      'loadError',
    ]);
    const prometheusActivities = [];
    const resourceActivities = [];

    if (getResiliencyProgress(progressResponse) < 1) {
      prometheusActivities.push({
        results: progressResponse,
        loader: () => import('./data-resiliency-activity').then((m) => m.DataResiliency),
      });
    }

    return (
      <OngoingActivityBody
        loaded={progressResponse || progressError}
        resourceActivities={resourceActivities}
        prometheusActivities={prometheusActivities}
      />
    );
  },
);

export const ActivityCard: React.FC<{}> = React.memo(() => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>Activity</DashboardCardTitle>
    </DashboardCardHeader>
    <DashboardCardBody>
      <ActivityBody className="ceph-activity-card__body">
        <OngoingActivity />
        <RecentEvent />
      </ActivityBody>
    </DashboardCardBody>
  </DashboardCard>
));
