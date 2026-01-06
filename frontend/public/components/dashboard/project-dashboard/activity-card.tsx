import type { FC } from 'react';
import { useEffect, useMemo, useContext } from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import { Card, CardFooter, CardHeader, CardTitle, Divider } from '@patternfly/react-core';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import type { FirehoseResource, FirehoseResult } from '../../utils/types';
import { EventModel } from '../../../models';
import { EventKind, K8sKind } from '../../../module/k8s';
import {
  useResolvedExtensions,
  DashboardsOverviewResourceActivity,
  isDashboardsOverviewResourceActivity,
} from '@console/dynamic-plugin-sdk';
import { uniqueResource } from '../dashboards-page/cluster-dashboard/utils';
import { RootState } from '../../../redux';
import { ProjectDashboardContext } from './project-dashboard-context';
import { getName } from '@console/shared/src/selectors/common';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

const getEventsResource = (projectName: string): FirehoseResource => ({
  isList: true,
  kind: EventModel.kind,
  prop: 'events',
  namespace: projectName,
});

const RecentEvent = withDashboardResources<RecentEventProps>(
  ({ watchK8sResource, stopWatchK8sResource, resources, projectName, viewEvents }) => {
    useEffect(() => {
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
      const [resourceActivityExtensions] = useResolvedExtensions<
        DashboardsOverviewResourceActivity
      >(isDashboardsOverviewResourceActivity);

      const resourceActivities = useMemo(
        () =>
          resourceActivityExtensions.filter((e) => {
            const model = models.get(e.properties.k8sResource.kind);
            return model && model.namespaced;
          }),
        [resourceActivityExtensions, models],
      );

      useEffect(() => {
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

      const allResourceActivities = useMemo(
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
                  component: a.properties.component,
                }));
            }),
          ),
        [resourceActivities, resources],
      );

      const resourcesLoaded = useMemo(
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

const RecentEventFooter = withDashboardResources(
  ({
    watchK8sResource,
    stopWatchK8sResource,
    resources,
    projectName,
    viewEvents,
  }: DashboardItemProps & { projectName: string; viewEvents: string }) => {
    const { t } = useTranslation();
    useEffect(() => {
      if (projectName) {
        const eventsResource = getEventsResource(projectName);
        watchK8sResource(eventsResource);
        return () => {
          stopWatchK8sResource(eventsResource);
        };
      }
    }, [watchK8sResource, stopWatchK8sResource, projectName]);

    const events = resources.events as FirehoseResult<EventKind[]>;
    const shouldShowFooter = events?.loaded && events?.data && events.data.length > 50;

    if (!shouldShowFooter) {
      return null;
    }

    return (
      <>
        <Divider />
        <CardFooter>
          <Link to={viewEvents} data-test="events-view-all-link">
            {t('console-shared~View all events')}
          </Link>
        </CardFooter>
      </>
    );
  },
);

export const ActivityCard: FC = () => {
  const { obj } = useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const viewEvents = `/k8s/ns/${projectName}/events`;
  const { t } = useTranslation();
  return (
    <>
      <Card data-test-id="activity-card">
        <CardHeader>
          <CardTitle>{t('public~Activity')}</CardTitle>
        </CardHeader>
        <ActivityBody className="co-project-dashboard__activity-body">
          <OngoingActivity projectName={projectName} />
          <RecentEvent projectName={projectName} viewEvents={viewEvents} />
        </ActivityBody>
        <RecentEventFooter projectName={projectName} viewEvents={viewEvents} />
      </Card>
    </>
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
