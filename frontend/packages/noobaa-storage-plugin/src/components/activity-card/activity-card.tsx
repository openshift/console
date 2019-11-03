import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { EventKind } from '@console/internal/module/k8s';
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
import { DATA_RESILIENCE_QUERIES } from '../../queries';
import { isDataResiliencyActivity } from './data-resiliency-activity/data-resiliency-activity';
import './activity-card.scss';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const isNoobaaEventObject = (event: EventKind): boolean => {
  const eventName: string = _.get(event, 'involvedObject.name');
  return _.startsWith(eventName, 'noobaa');
};

const noobaaEventsFilter = (event: EventKind): boolean => {
  const eventKind: string = _.get(event, 'involvedObject.kind');
  if (eventKind === PodModel.kind || eventKind === StatefulSetModel.kind) {
    return isNoobaaEventObject(event);
  }
  return false;
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
        filter={noobaaEventsFilter}
      />
    );
  },
);

const OngoingActivity = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    React.useEffect(() => {
      watchPrometheus(DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY);
      watchPrometheus(DATA_RESILIENCE_QUERIES.REBUILD_TIME_QUERY);
      return () => {
        stopWatchPrometheusQuery(DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY);
        stopWatchPrometheusQuery(DATA_RESILIENCE_QUERIES.REBUILD_TIME_QUERY);
      };
    }, [watchPrometheus, stopWatchPrometheusQuery]);

    const progress = prometheusResults.getIn([
      DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
      'data',
    ]) as PrometheusResponse;
    const progressError = prometheusResults.getIn([
      DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
      'loadError',
    ]);

    const eta = prometheusResults.getIn([
      DATA_RESILIENCE_QUERIES.REBUILD_TIME_QUERY,
      'data',
    ]) as PrometheusResponse;

    const prometheusActivities = [];

    if (isDataResiliencyActivity(progress)) {
      prometheusActivities.push({
        results: [progress, eta],
        loader: () =>
          import('./data-resiliency-activity/data-resiliency-activity').then(
            (m) => m.DataResiliencyActivity,
          ),
      });
    }

    return (
      <OngoingActivityBody
        loaded={progress || progressError}
        prometheusActivities={prometheusActivities}
      />
    );
  },
);

const ActivityCard: React.FC<{}> = () => (
  <DashboardCard>
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
