import type { FC } from 'react';
import { useEffect, useMemo, memo } from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

import { Card, CardHeader, CardTitle, CardFooter, Divider } from '@patternfly/react-core';
import { useDynamicK8sWatchResources } from '@console/shared/src/hooks/useDynamicK8sWatchResources';
import { useDashboardResources } from '@console/shared/src/hooks/useDashboardResources';
import { useK8sWatchResource } from '../../../utils/k8s-watch-hook';
import { EventModel } from '../../../../models';
import { EventKind, K8sKind, K8sResourceCommon } from '../../../../module/k8s';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import {
  useResolvedExtensions,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewPrometheusActivity,
  isDashboardsOverviewResourceActivity,
  isDashboardsOverviewPrometheusActivity,
} from '@console/dynamic-plugin-sdk';
import { uniqueResource } from './utils';
import { PrometheusResponse } from '../../../graphs';

const viewEvents = '/k8s/all-namespaces/events';

const RecentEvent: FC = () => {
  const { t } = useTranslation();

  const [eventsData, eventsLoaded, eventsLoadError] = useK8sWatchResource<EventKind[]>({
    isList: true,
    kind: EventModel.kind,
  });

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

const mapStateToProps = ({ k8s }) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const OngoingActivityComponent: FC<OngoingActivityProps> = ({ models }) => {
  const { watchResource, stopWatchResource, results: resources } = useDynamicK8sWatchResources();

  const [resourceActivityExtensions] = useResolvedExtensions<DashboardsOverviewResourceActivity>(
    isDashboardsOverviewResourceActivity,
  );

  const resourceActivities = useMemo(
    () => resourceActivityExtensions.filter((e) => !!models.get(e.properties.k8sResource.kind)),
    [resourceActivityExtensions, models],
  );

  const [prometheusActivities] = useResolvedExtensions<DashboardsOverviewPrometheusActivity>(
    isDashboardsOverviewPrometheusActivity,
  );

  const prometheusQueries = useMemo(
    () => prometheusActivities.flatMap((a) => a.properties.queries.map((query) => ({ query }))),
    [prometheusActivities],
  );

  const { prometheusResults } = useDashboardResources({ prometheusQueries });

  useEffect(() => {
    resourceActivities.forEach((a, index) => {
      const uniqueRes = uniqueResource(a.properties.k8sResource, index);
      const { prop, ...resourceConfig } = uniqueRes;
      watchResource(prop, resourceConfig);
    });
    return () => {
      resourceActivities.forEach((a, index) => {
        const resourceKey = uniqueResource(a.properties.k8sResource, index).prop;
        stopWatchResource(resourceKey);
      });
    };
  }, [watchResource, stopWatchResource, resourceActivities]);

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

  const allPrometheusActivities = useMemo(
    () =>
      prometheusActivities
        .filter((a) => {
          const queryResults = a.properties.queries.map(
            (q) => prometheusResults.getIn([q, 'data']) as PrometheusResponse,
          );
          return a.properties.isActivity(queryResults);
        })
        .map((a) => {
          const queryResults = a.properties.queries.map(
            (q) => prometheusResults.getIn([q, 'data']) as PrometheusResponse,
          );
          return {
            component: a.properties.component,
            results: queryResults,
          };
        }),
    [prometheusActivities, prometheusResults],
  );

  const resourcesLoaded = useMemo(
    () =>
      resourceActivities.every((a, index) => {
        const uniqueProp = uniqueResource(a.properties.k8sResource, index).prop;
        return resources[uniqueProp]?.loaded || resources[uniqueProp]?.loadError;
      }),
    [resourceActivities, resources],
  );

  const queriesLoaded = useMemo(
    () =>
      prometheusActivities.every((a) =>
        a.properties.queries.every(
          (q) => prometheusResults.getIn([q, 'data']) || prometheusResults.getIn([q, 'loadError']),
        ),
      ),
    [prometheusActivities, prometheusResults],
  );

  return (
    <OngoingActivityBody
      loaded={resourcesLoaded && queriesLoaded}
      resourceActivities={allResourceActivities}
      prometheusActivities={allPrometheusActivities}
    />
  );
};

const OngoingActivity = connect(mapStateToProps)(OngoingActivityComponent);

export const ActivityCard: FC<{}> = memo(() => {
  const { t } = useTranslation();

  return (
    <Card data-test-id="activity-card">
      <CardHeader>
        <CardTitle>{t('public~Activity')}</CardTitle>
      </CardHeader>
      <ActivityBody className="co-overview-dashboard__activity-body">
        <OngoingActivity />
        <RecentEvent />
      </ActivityBody>
    </Card>
  );
});

type OngoingActivityProps = {
  models: ImmutableMap<string, K8sKind>;
};
