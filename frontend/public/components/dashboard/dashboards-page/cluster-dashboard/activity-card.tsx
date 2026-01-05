import type { FC } from 'react';
import { useEffect, useMemo, memo } from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

import { Card, CardHeader, CardTitle, CardFooter, Divider } from '@patternfly/react-core';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { EventModel } from '../../../../models';
import { FirehoseResource, FirehoseResult } from '../../../utils/types';
import { EventKind, K8sKind } from '../../../../module/k8s';
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

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };
const viewEvents = '/k8s/all-namespaces/events';

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }) => {
    useEffect(() => {
      watchK8sResource(eventsResource);
      return () => {
        stopWatchK8sResource(eventsResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);
    return (
      <RecentEventsBody
        events={resources.events as FirehoseResult<EventKind[]>}
        moreLink={viewEvents}
      />
    );
  },
);

const mapStateToProps = ({ k8s }) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const OngoingActivity = connect(mapStateToProps)(
  withDashboardResources(
    ({
      watchK8sResource,
      stopWatchK8sResource,
      resources,
      watchPrometheus,
      stopWatchPrometheusQuery,
      prometheusResults,
      models,
    }: DashboardItemProps & OngoingActivityProps) => {
      const [resourceActivityExtensions] = useResolvedExtensions<
        DashboardsOverviewResourceActivity
      >(isDashboardsOverviewResourceActivity);

      const resourceActivities = useMemo(
        () => resourceActivityExtensions.filter((e) => !!models.get(e.properties.k8sResource.kind)),
        [resourceActivityExtensions, models],
      );

      const [prometheusActivities] = useResolvedExtensions<DashboardsOverviewPrometheusActivity>(
        isDashboardsOverviewPrometheusActivity,
      );

      useEffect(() => {
        resourceActivities.forEach((a, index) => {
          watchK8sResource(uniqueResource(a.properties.k8sResource, index));
        });
        prometheusActivities.forEach((a) =>
          a.properties.queries.forEach((q) => watchPrometheus(q)),
        );
        return () => {
          resourceActivities.forEach((a, index) => {
            stopWatchK8sResource(uniqueResource(a.properties.k8sResource, index));
          });
          prometheusActivities.forEach((a) =>
            a.properties.queries.forEach(stopWatchPrometheusQuery),
          );
        };
      }, [
        watchK8sResource,
        stopWatchK8sResource,
        watchPrometheus,
        stopWatchPrometheusQuery,
        resourceActivities,
        prometheusActivities,
      ]);

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
              (q) =>
                prometheusResults.getIn([q, 'data']) || prometheusResults.getIn([q, 'loadError']),
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
    },
  ),
);

const RecentEventFooter = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }) => {
    const { t } = useTranslation();
    useEffect(() => {
      watchK8sResource(eventsResource);
      return () => {
        stopWatchK8sResource(eventsResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);

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
            {t('public~View all events')}
          </Link>
        </CardFooter>
      </>
    );
  },
);

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
      <RecentEventFooter />
    </Card>
  );
});

type OngoingActivityProps = {
  models: ImmutableMap<string, K8sKind>;
};
