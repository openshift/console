import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { EventModel } from '../../../../models';
import { FirehoseResource, FirehoseResult } from '../../../utils';
import { EventKind, K8sKind } from '../../../../module/k8s';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import * as plugins from '../../../../plugins';
import {
  isDashboardsOverviewResourceActivity,
  isDashboardsOverviewPrometheusActivity,
} from '@console/plugin-sdk';
import { uniqueResource } from './utils';
import { PrometheusResponse } from '../../../graphs';
import { connectToFlags, WithFlagsProps, FlagsObject } from '../../../../reducers/features';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }) => {
    React.useEffect(() => {
      watchK8sResource(eventsResource);
      return () => {
        stopWatchK8sResource(eventsResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);
    return <RecentEventsBody events={resources.events as FirehoseResult<EventKind[]>} />;
  },
);

const getResourceActivities = (flags: FlagsObject, k8sModels: ImmutableMap<string, K8sKind>) =>
  plugins.registry
    .getDashboardsOverviewResourceActivities()
    .filter(
      (e) =>
        plugins.registry.isExtensionInUse(e, flags) &&
        !!k8sModels.get(e.properties.k8sResource.kind),
    );

const getPrometheusActivities = (flags: FlagsObject) =>
  plugins.registry
    .getDashboardsOverviewPrometheusActivities()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags));

const mapStateToProps = ({ k8s }) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const OngoingActivity = connect(mapStateToProps)(
  connectToFlags(
    ...plugins.registry.getRequiredFlags([
      isDashboardsOverviewResourceActivity,
      isDashboardsOverviewPrometheusActivity,
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
        models,
      }: DashboardItemProps & WithFlagsProps & OngoingActivityProps) => {
        React.useEffect(() => {
          const resourceActivities = getResourceActivities(flags, models);
          resourceActivities.forEach((a, index) => {
            watchK8sResource(uniqueResource(a.properties.k8sResource, index));
          });
          const prometheusActivities = getPrometheusActivities(flags);
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

        const resourceActivities = getResourceActivities(flags, models);
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
                timestamp: a.properties.getTimestamp ? a.properties.getTimestamp(r) : null,
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
            (q) =>
              prometheusResults.getIn([q, 'data']) || prometheusResults.getIn([q, 'loadError']),
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
  ),
);

export const ActivityCard: React.FC<{}> = React.memo(() => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>Activity</DashboardCardTitle>
      <DashboardCardLink to="/k8s/all-namespaces/events">View events</DashboardCardLink>
    </DashboardCardHeader>
    <DashboardCardBody>
      <ActivityBody className="co-overview-dashboard__activity-body">
        <OngoingActivity />
        <RecentEvent />
      </ActivityBody>
    </DashboardCardBody>
  </DashboardCard>
));

type OngoingActivityProps = {
  models: ImmutableMap<string, K8sKind>;
};
