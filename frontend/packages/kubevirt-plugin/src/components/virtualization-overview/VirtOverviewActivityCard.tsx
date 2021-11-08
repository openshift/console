import * as React from 'react';
import { Card, CardActions, CardHeader, CardTitle } from '@patternfly/react-core';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  K8sKind,
  PrometheusResponse,
  FirehoseResult,
  FirehoseResource,
  useResolvedExtensions,
  DashboardsOverviewResourceActivity as DynamicDashboardsOverviewResourceActivity,
  DashboardsOverviewPrometheusActivity as DynamicDashboardsOverviewPrometheusActivity,
  isDashboardsOverviewResourceActivity as isDynamicDashboardsOverviewResourceActivity,
  isDashboardsOverviewPrometheusActivity as isDynamicDashboardsOverviewPrometheusActivity,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
import { uniqueResource } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utils';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { EventModel } from '@console/internal/models/index';
import { EventKind } from '@console/internal/module/k8s/types';
import {
  useExtensions,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewPrometheusActivity,
  isDashboardsOverviewResourceActivity,
  isDashboardsOverviewPrometheusActivity,
} from '@console/plugin-sdk';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };
const viewEvents = '/k8s/all-namespaces/events';
const eventTypes = [VirtualMachineModel.kind, VirtualMachineInstanceModel.kind, 'HyperConverged'];

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }) => {
    React.useEffect(() => {
      watchK8sResource(eventsResource);
      return () => {
        stopWatchK8sResource(eventsResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);

    const events = resources?.events?.loaded ? (resources.events.data as EventKind[]) : [];
    const filteredEvents = events.filter((e) => eventTypes.includes(e.involvedObject.kind));
    const wrappedFilteredEvents: FirehoseResult<EventKind[]> = {
      ...resources.events,
      data: filteredEvents,
    };

    return <RecentEventsBody events={wrappedFilteredEvents} moreLink={viewEvents} />;
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
      const resourceActivityExtensions = useExtensions<DashboardsOverviewResourceActivity>(
        isDashboardsOverviewResourceActivity,
      );
      const [dynamicResourceActivityExtensions] = useResolvedExtensions<
        DynamicDashboardsOverviewResourceActivity
      >(isDynamicDashboardsOverviewResourceActivity);

      const resourceActivities = React.useMemo(
        () =>
          [...resourceActivityExtensions, ...dynamicResourceActivityExtensions].filter(
            (e) => !!models.get(e.properties.k8sResource.kind),
          ),
        [dynamicResourceActivityExtensions, models, resourceActivityExtensions],
      );

      const prometheusActivities = useExtensions<DashboardsOverviewPrometheusActivity>(
        isDashboardsOverviewPrometheusActivity,
      );
      const [dynamicPrometheusActivities] = useResolvedExtensions<
        DynamicDashboardsOverviewPrometheusActivity
      >(isDynamicDashboardsOverviewPrometheusActivity);

      React.useEffect(() => {
        resourceActivities.forEach((a, index) => {
          watchK8sResource(uniqueResource(a.properties.k8sResource, index));
        });
        [...prometheusActivities, ...dynamicPrometheusActivities].forEach((a) =>
          a.properties.queries.forEach((q) => watchPrometheus(q)),
        );
        return () => {
          resourceActivities.forEach((a, index) => {
            stopWatchK8sResource(uniqueResource(a.properties.k8sResource, index));
          });
          [...prometheusActivities, ...dynamicPrometheusActivities].forEach((a) =>
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
        dynamicPrometheusActivities,
      ]);

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
                  loader: (a as DashboardsOverviewResourceActivity)?.properties?.loader,
                  component: (a as ResolvedExtension<DynamicDashboardsOverviewResourceActivity>)
                    ?.properties?.component,
                }));
            }),
          ),
        [resourceActivities, resources],
      );

      const allPrometheusActivities = React.useMemo(
        () =>
          [...prometheusActivities, ...dynamicPrometheusActivities]
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
                loader: (a as DashboardsOverviewPrometheusActivity)?.properties.loader,
                component: (a as ResolvedExtension<DynamicDashboardsOverviewPrometheusActivity>)
                  ?.properties.component,
                results: queryResults,
              };
            }),
        [dynamicPrometheusActivities, prometheusActivities, prometheusResults],
      );

      const resourcesLoaded = React.useMemo(
        () =>
          resourceActivities.every((a, index) => {
            const uniqueProp = uniqueResource(a.properties.k8sResource, index).prop;
            return resources[uniqueProp]?.loaded || resources[uniqueProp]?.loadError;
          }),
        [resourceActivities, resources],
      );

      const queriesLoaded = React.useMemo(
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

export const VirtOverviewActivityCard: React.FC<{}> = React.memo(() => {
  const { t } = useTranslation();
  return (
    <Card className="co-overview-card--gradient" data-test-id="kubevirt-activity-card">
      <CardHeader>
        <CardTitle>{t('public~Activity')}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <Link to={viewEvents}>{t('kubevirt-plugin~View events')}</Link>
        </CardActions>
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
