import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { FirehoseResource, FirehoseResult } from '../../utils';
import { EventModel } from '../../../models';
import { EventKind, K8sKind } from '../../../module/k8s';
import {
  useExtensions,
  DashboardsOverviewResourceActivity,
  isDashboardsOverviewResourceActivity,
} from '@console/plugin-sdk';
import { uniqueResource } from '../dashboards-page/cluster-dashboard/utils';
import { RootState } from '../../../redux-types';
import { ProjectDashboardContext } from './project-dashboard-context';
import { getName } from '@console/shared';

const getEventsResource = (projectName: string): FirehoseResource => ({
  isList: true,
  kind: EventModel.kind,
  prop: 'events',
  namespace: projectName,
});

const RecentEvent = withDashboardResources<RecentEventProps>(
  ({ watchK8sResource, stopWatchK8sResource, resources, projectName, viewEvents }) => {
    React.useEffect(() => {
      if (projectName) {
        const eventsResource = getEventsResource(projectName);
        watchK8sResource(eventsResource);
        return () => {
          stopWatchK8sResource(eventsResource);
        };
      }
    }, [watchK8sResource, stopWatchK8sResource, projectName]);
    return (
      <RecentEventsBody
        events={resources.events as FirehoseResult<EventKind[]>}
        moreLink={viewEvents}
      />
    );
  },
);

const mapStateToProps = (state: RootState): OngoingActivityReduxProps => ({
  models: state.k8s.getIn(['RESOURCES', 'models']) as ImmutableMap<string, K8sKind>,
});

const OngoingActivity = connect(mapStateToProps)(
  withDashboardResources(
    ({
      watchK8sResource,
      stopWatchK8sResource,
      resources,
      projectName,
      models,
    }: DashboardItemProps & OngoingActivityProps) => {
      const resourceActivityExtensions = useExtensions<DashboardsOverviewResourceActivity>(
        isDashboardsOverviewResourceActivity,
      );

      const resourceActivities = React.useMemo(
        () =>
          resourceActivityExtensions.filter((e) => {
            const model = models.get(e.properties.k8sResource.kind);
            return model && model.namespaced;
          }),
        [resourceActivityExtensions, models],
      );

      React.useEffect(() => {
        if (projectName) {
          resourceActivities.forEach((a, index) => {
            watchK8sResource(
              uniqueResource({ ...a.properties.k8sResource, namespace: projectName }, index),
            );
          });
          return () => {
            resourceActivities.forEach((a, index) => {
              stopWatchK8sResource(uniqueResource(a.properties.k8sResource, index));
            });
          };
        }
      }, [watchK8sResource, stopWatchK8sResource, projectName, resourceActivities]);

      const allResourceActivities = React.useMemo(
        () =>
          _.flatten(
            resourceActivities.map((a, index) => {
              const k8sResources = _.get(
                resources,
                [uniqueResource(a.properties.k8sResource, index).prop, 'data'],
                [],
              ) as FirehoseResult['data'];
              return k8sResources
                .filter((r) => (a.properties.isActivity ? a.properties.isActivity(r) : true))
                .map((r) => ({
                  resource: r,
                  timestamp: a.properties.getTimestamp ? a.properties.getTimestamp(r) : null,
                  loader: a.properties.loader,
                }));
            }),
          ),
        [resourceActivities, resources],
      );

      const resourcesLoaded = React.useMemo(
        () =>
          resourceActivities.every((a, index) =>
            _.get(resources, [uniqueResource(a.properties.k8sResource, index).prop, 'loaded']),
          ),
        [resourceActivities, resources],
      );

      return (
        <OngoingActivityBody
          loaded={projectName && resourcesLoaded && models.size !== 0}
          resourceActivities={allResourceActivities}
        />
      );
    },
  ),
);

export const ActivityCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const viewEvents = `/k8s/ns/${projectName}/events`;
  return (
    <DashboardCard gradient data-test-id="activity-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Activity</DashboardCardTitle>
        <DashboardCardLink to={viewEvents}>View events</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody className="co-project-dashboard__activity-body">
          <OngoingActivity projectName={projectName} />
          <RecentEvent projectName={projectName} viewEvents={viewEvents} />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type RecentEventProps = DashboardItemProps & {
  projectName: string;
  viewEvents: string;
};

type OngoingActivityReduxProps = {
  models: ImmutableMap<string, K8sKind>;
};

type OngoingActivityProps = OngoingActivityReduxProps & {
  projectName: string;
};
