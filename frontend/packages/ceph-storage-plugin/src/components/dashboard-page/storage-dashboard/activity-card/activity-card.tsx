import * as React from 'react';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { EventKind, K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { EventModel, PersistentVolumeClaimModel } from '@console/internal/models';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getNamespace } from '@console/shared';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { SubscriptionModel, SubscriptionKind } from '@console/operator-lifecycle-manager';
import { CEPH_STORAGE_NAMESPACE, OCS_OPERATOR } from '../../../../constants/index';
import { DATA_RESILIENCY_QUERY, StorageDashboardQuery } from '../../../../constants/queries';
import { OCSServiceModel } from '../../../../models';
import { isClusterExpandActivity, ClusterExpandActivity } from './cluster-expand-activity';
import { isOCSUpgradeActivity, OCSUpgradeActivity } from './ocs-upgrade-activity';
import { isResilencyActivity } from './data-resiliency-activity';
import './activity-card.scss';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };
const subscriptionResource: FirehoseResource = {
  isList: true,
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subs',
};

const storageClusterResource: FirehoseResource = {
  isList: true,
  kind: referenceForModel(OCSServiceModel),
  namespaced: false,
  prop: 'storage-cluster',
};

export const getOCSSubscription = (subscriptions: FirehoseResult): SubscriptionKind => {
  const itemsData: K8sResourceKind[] = subscriptions?.data;
  return _.find(itemsData, (item) => item?.spec?.name === OCS_OPERATOR) as SubscriptionKind;
};

const ocsEventNamespaceKindFilter = (event: EventKind): boolean => {
  const eventKind = event?.involvedObject?.kind;
  const eventNamespace = getNamespace(event);
  return eventNamespace === CEPH_STORAGE_NAMESPACE || eventKind === PersistentVolumeClaimModel.kind;
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
        filter={ocsEventNamespaceKindFilter}
      />
    );
  },
);

const OngoingActivity = withDashboardResources(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    watchK8sResource,
    stopWatchK8sResource,
    resources,
    prometheusResults,
  }) => {
    React.useEffect(() => {
      watchK8sResource(subscriptionResource);
      watchK8sResource(storageClusterResource);
      watchPrometheus(DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS]);
      return () => {
        stopWatchK8sResource(subscriptionResource);
        stopWatchK8sResource(storageClusterResource);
        stopWatchPrometheusQuery(DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS]);
      };
    }, [watchPrometheus, stopWatchPrometheusQuery, watchK8sResource, stopWatchK8sResource]);

    const progressResponse = prometheusResults.getIn([
      DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS],
      'data',
    ]) as PrometheusResponse;
    const progressError = prometheusResults.getIn([
      DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS],
      'loadError',
    ]);

    const subscriptions = resources?.subs as FirehoseResult;
    const subscriptionsLoaded = subscriptions?.loaded;
    const ocsSubscription: SubscriptionKind = getOCSSubscription(subscriptions);

    const storageClusters = resources?.['storage-cluster'] as FirehoseResult;
    const storageClustersLoaded = storageClusters?.loaded;
    const ocsCluster: K8sResourceKind = storageClusters?.data?.[0];

    const prometheusActivities = [];
    const resourceActivities = [];

    if (isResilencyActivity(progressResponse)) {
      prometheusActivities.push({
        results: progressResponse,
        loader: () => import('./data-resiliency-activity').then((m) => m.DataResiliency),
      });
    }

    if (isOCSUpgradeActivity(ocsSubscription)) {
      resourceActivities.push({
        resource: ocsSubscription,
        timestamp: ocsSubscription?.status?.lastUpdated,
        loader: () => Promise.resolve(OCSUpgradeActivity),
      });
    }

    if (isClusterExpandActivity(ocsCluster)) {
      resourceActivities.push({
        resource: ocsCluster,
        timestamp: null,
        loader: () => Promise.resolve(ClusterExpandActivity),
      });
    }

    return (
      <OngoingActivityBody
        loaded={(progressResponse || progressError) && subscriptionsLoaded && storageClustersLoaded}
        resourceActivities={resourceActivities}
        prometheusActivities={prometheusActivities}
      />
    );
  },
);

export const ActivityCard: React.FC = React.memo(() => (
  <DashboardCard gradient>
    <DashboardCardHeader>
      <DashboardCardTitle>Activity</DashboardCardTitle>
    </DashboardCardHeader>
    <DashboardCardBody>
      <ActivityBody className="ceph-activity-card__body">
        <OngoingActivity />
        <RecentEvent />
      </ActivityBody>
    </DashboardCardBody>
  </DashboardCard>
));
