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
import { useDynamicK8sWatchResources } from '@console/shared/src/hooks/useDynamicK8sWatchResources';
import { useK8sWatchResource } from '../../utils/k8s-watch-hook';
import { EventModel } from '../../../models';
import { EventKind, K8sKind, K8sResourceCommon } from '../../../module/k8s';
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

const RecentEvent: FC<{ projectName: string; viewEvents: string }> = ({
  projectName,
  viewEvents,
}) => {
  const { t } = useTranslation();

  const [eventsData, eventsLoaded, eventsLoadError] = useK8sWatchResource<EventKind[]>(
    projectName
      ? {
          isList: true,
          kind: EventModel.kind,
          namespace: projectName,
        }
      : null,
  );

  const shouldShowFooter = eventsLoaded && eventsData && eventsData.length > 50;

  return (
    <>
      <RecentEventsBody
        eventsData={eventsData}
        eventsLoaded={eventsLoaded}
        eventsLoadError={eventsLoadError}
        moreLink={viewEvents}
      />
      {shouldShowFooter && (
        <>
          <Divider />
          <CardFooter>
            <Link to={viewEvents} data-test="events-view-all-link">
              {t('public~View all events')}
            </Link>
          </CardFooter>
        </>
      )}
    </>
  );
};

const mapStateToProps = (state: RootState): OngoingActivityReduxProps => ({
  models: state.k8s.getIn(['RESOURCES', 'models']) as ImmutableMap<string, K8sKind>,
});

const OngoingActivityComponent: FC<OngoingActivityProps> = ({ projectName, models }) => {
  const { watchResource, stopWatchResource, results: resources } = useDynamicK8sWatchResources();

  const [resourceActivityExtensions] = useResolvedExtensions<DashboardsOverviewResourceActivity>(
    isDashboardsOverviewResourceActivity,
  );

  const resourceActivities = useMemo(
    () =>
      resourceActivityExtensions.filter((e) => {
        const model = models.get(e.properties.k8sResource.kind);
        return model && model.namespaced;
      }),
    [resourceActivityExtensions, models],
  );

  useEffect(() => {
    if (!projectName) {
      return;
    }

    resourceActivities.forEach((a, index) => {
      const uniqueRes = uniqueResource(a.properties.k8sResource, index);
      const { prop, ...resourceConfig } = uniqueRes;
      watchResource(prop, { ...resourceConfig, namespace: projectName });
    });

    return () => {
      resourceActivities.forEach((a, index) => {
        const resourceKey = uniqueResource(a.properties.k8sResource, index).prop;
        stopWatchResource(resourceKey);
      });
    };
  }, [watchResource, stopWatchResource, projectName, resourceActivities]);

  const allResourceActivities = useMemo(
    () =>
      _.flatten(
        resourceActivities.map((a, index) => {
          const k8sResources = _.get(
            resources,
            [uniqueResource(a.properties.k8sResource, index).prop, 'data'],
            [],
          ) as K8sResourceCommon[];
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
};

const OngoingActivity = connect(mapStateToProps)(OngoingActivityComponent);

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
      </Card>
    </>
  );
};

type OngoingActivityReduxProps = {
  models: ImmutableMap<string, K8sKind>;
};

type OngoingActivityProps = OngoingActivityReduxProps & {
  projectName: string;
};
