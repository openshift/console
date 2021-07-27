import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  EventKind,
  K8sResourceKind,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getAnnotations, isCephProvisioner, getName, useDeepCompareMemoize } from '@console/shared';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { SubscriptionKind } from '@console/operator-lifecycle-manager';
import { isClusterExpandActivity, ClusterExpandActivity } from './cluster-expand-activity';
import { isOCSUpgradeActivity, OCSUpgradeActivity } from './ocs-upgrade-activity';
import { OCS_OPERATOR, PVC_PROVISIONER_ANNOTATION } from '../../../../constants/index';
import { DATA_RESILIENCY_QUERY, StorageDashboardQuery } from '../../../../queries';
import {
  pvcResource,
  subscriptionResource,
  storageClusterResource,
  eventsResource,
} from '../../../../resources';
import { getResiliencyProgress, isPersistentStorageEvent } from '../../../../utils';
import './activity-card.scss';

export const getOCSSubscription = (subscriptions: FirehoseResult): SubscriptionKind => {
  const itemsData: K8sResourceKind[] = subscriptions?.data;
  return _.find(itemsData, (item) => item?.spec?.name === OCS_OPERATOR) as SubscriptionKind;
};

const RecentEvent = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }: DashboardItemProps) => {
    React.useEffect(() => {
      watchK8sResource(eventsResource);
      watchK8sResource(pvcResource);
      return () => {
        stopWatchK8sResource(eventsResource);
        stopWatchK8sResource(pvcResource);
      };
    }, [watchK8sResource, stopWatchK8sResource]);

    const validPVC = ((resources.pvcs?.data || []) as PersistentVolumeClaimKind[])
      .filter((obj) => isCephProvisioner(getAnnotations(obj)?.[PVC_PROVISIONER_ANNOTATION]))
      .map(getName);
    const memoizedPVCNames = useDeepCompareMemoize(validPVC, true);

    const ocsEventsFilter = React.useCallback(isPersistentStorageEvent(memoizedPVCNames), [
      memoizedPVCNames,
    ]);

    const events = {
      ...resources.events,
      loaded: resources?.events?.loaded && resources?.pvcs?.loaded,
    };

    return (
      <RecentEventsBody events={events as FirehoseResult<EventKind[]>} filter={ocsEventsFilter} />
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

    if (getResiliencyProgress(progressResponse) < 1) {
      prometheusActivities.push({
        results: progressResponse,
        loader: () =>
          import('../../common/data-resiliency/data-resiliency-activity').then(
            (m) => m.DataResiliency,
          ),
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

export const ActivityCard: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Activity')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody className="ceph-activity-card__body">
          <OngoingActivity />
          <RecentEvent />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
});

export default ActivityCard;
