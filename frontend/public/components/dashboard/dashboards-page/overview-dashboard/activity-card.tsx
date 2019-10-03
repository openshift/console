import * as React from 'react';
import * as _ from 'lodash-es';

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardLink,
  DashboardCardTitle,
} from '../../generic/dashboard-card';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { EventModel } from '../../../../models';
import { FirehoseResource, FirehoseResult } from '../../../utils';
import { EventKind } from '../../../../module/k8s';
import {
  ActivityBody,
  RecentEventsBody,
  OngoingActivityBody,
} from '../../generic/activity-card/activity-body';
import * as plugins from '../../../../plugins';
import { uniqueResource } from './utils';
import { PrometheusResponse } from '../../../graphs';
import { connectToFlags, WithFlagsProps, FlagsObject } from '../../../../reducers/features';
import { getFlagsForExtensions, isDashboardExtensionInUse } from '../../utils';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }: DashboardItemProps) => {
    React.useEffect(() => {
      watchK8sResource(eventsResource);
      return () => {
        stopWatchK8sResource(eventsResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);
    return <RecentEventsBody events={resources.events as FirehoseResult<EventKind[]>} />;
  },
);

const getResourceActivities = (flags: FlagsObject) =>
  plugins.registry
    .getDashboardsOverviewResourceActivities()
    .filter((e) => isDashboardExtensionInUse(e, flags));

const getPrometheusActivities = (flags: FlagsObject) =>
  plugins.registry
    .getDashboardsOverviewPrometheusActivities()
    .filter((e) => isDashboardExtensionInUse(e, flags));

const OngoingActivity = connectToFlags(
  ...getFlagsForExtensions([
    ...plugins.registry.getDashboardsOverviewResourceActivities(),
    ...plugins.registry.getDashboardsOverviewPrometheusActivities(),
  ]),
)(
  withDashboardResources(
    ({
      watchK8sResource,
      stopWatchK8sResource,
      resources,
      watchPrometheus,
      stopWatchPrometheusQuery,
      prometheusResults,
      flags,
    }: DashboardItemProps & WithFlagsProps) => {
      React.useEffect(() => {
        const resourceActivities = getResourceActivities(flags);
        resourceActivities.forEach((a, index) => {
          watchK8sResource(uniqueResource(a.properties.k8sResource, index));
        });
        const prometheusActivities = getPrometheusActivities(flags);
        prometheusActivities.forEach((a) => a.properties.queries.forEach(watchPrometheus));
        return () => {
          resourceActivities.forEach((a, index) => {
            stopWatchK8sResource(uniqueResource(a.properties.k8sResource, index));
          });
          prometheusActivities.forEach((a) =>
            a.properties.queries.forEach(stopWatchPrometheusQuery),
          );
        };
        // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
        /* eslint-disable react-hooks/exhaustive-deps */
      }, [
        watchK8sResource,
        stopWatchK8sResource,
        watchPrometheus,
        stopWatchPrometheusQuery,
        JSON.stringify(flags),
      ]);
      /* eslint-enable react-hooks/exhaustive-deps */

      const resourceActivities = getResourceActivities(flags);
      const allResourceActivities = _.flatten(
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
              timestamp: a.properties.getTimestamp(r),
              loader: a.properties.loader,
            }));
        }),
      );

      const prometheusActivities = getPrometheusActivities(flags);
      const allPrometheusActivities = prometheusActivities
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
            loader: a.properties.loader,
            results: queryResults,
          };
        });

      const resourcesLoaded = resourceActivities.every((a, index) =>
        _.get(resources, [uniqueResource(a.properties.k8sResource, index).prop, 'loaded']),
      );
      const queriesLoaded = prometheusActivities.every((a) =>
        a.properties.queries.every(
          (q) => prometheusResults.getIn([q, 'data']) || prometheusResults.getIn([q, 'loadError']),
        ),
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

export const ActivityCard: React.FC<{}> = React.memo(() => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>Activity</DashboardCardTitle>
      <DashboardCardLink to="/k8s/all-namespaces/events">View events</DashboardCardLink>
    </DashboardCardHeader>
    <DashboardCardBody>
      <ActivityBody>
        <OngoingActivity />
        <RecentEvent />
      </ActivityBody>
    </DashboardCardBody>
  </DashboardCard>
));
