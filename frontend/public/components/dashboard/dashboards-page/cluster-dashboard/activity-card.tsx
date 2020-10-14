import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

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
import {
  useExtensions,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewPrometheusActivity,
  isDashboardsOverviewResourceActivity,
  isDashboardsOverviewPrometheusActivity,
} from '@console/plugin-sdk';
import { uniqueResource } from './utils';
import { PrometheusResponse } from '../../../graphs';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };
const viewEvents = '/k8s/all-namespaces/events';

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }) => {
    React.useEffect(() => {
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
      const resourceActivityExtensions = useExtensions<DashboardsOverviewResourceActivity>(
        isDashboardsOverviewResourceActivity,
      );

      const resourceActivities = React.useMemo(
        () => resourceActivityExtensions.filter((e) => !!models.get(e.properties.k8sResource.kind)),
        [resourceActivityExtensions, models],
      );

      const prometheusActivities = useExtensions<DashboardsOverviewPrometheusActivity>(
        isDashboardsOverviewPrometheusActivity,
      );

      React.useEffect(() => {
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

      const allPrometheusActivities = React.useMemo(
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
                loader: a.properties.loader,
                results: queryResults,
              };
            }),
        [prometheusActivities, prometheusResults],
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

export const ActivityCard: React.FC<{}> = React.memo(() => {
  const { t } = useTranslation();
  return (
    <DashboardCard gradient data-test-id="activity-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('dashboard~Activity')}</DashboardCardTitle>
        <DashboardCardLink to={viewEvents}>{t('dashboard~View events')}</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody className="co-overview-dashboard__activity-body">
          <OngoingActivity />
          <RecentEvent />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
});

type OngoingActivityProps = {
  models: ImmutableMap<string, K8sKind>;
};
