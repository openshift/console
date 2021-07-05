import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { getName, getInfrastructurePlatform } from '@console/dynamic-plugin-sdk';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/details-card/DetailItem';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { InfrastructureModel } from '@console/internal/models';
import { getOCSVersion } from '../../../selectors';
import { OCSServiceModel } from '../../../models';

const k8sResources: FirehoseResource[] = [
  {
    kind: referenceForModel(OCSServiceModel),
    namespaced: true,
    isList: true,
    namespace: 'openshift-storage',
    prop: 'ocs',
  },
  {
    kind: referenceForModel(SubscriptionModel),
    namespaced: false,
    isList: true,
    prop: 'subscription',
  },
];

export const DetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    k8sResources.forEach((r) => watchK8sResource(r));
    return () => {
      k8sResources.forEach((r) => stopWatchK8sResource(r));
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const { ocs, subscription } = resources;
  const ocsLoaded = ocs?.loaded || false;
  const ocsError = ocs?.loadError;
  const ocsData = ocs?.data;
  const ocsName = getName(ocsData?.[0]);
  const subscriptionLoaded = subscription?.loaded;
  const subscriptionError = subscription?.loadError;
  const subscriptionVersion = getOCSVersion(subscription as FirehoseResult);

  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  const infrastructurePlatform = getInfrastructurePlatform(infrastructure);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Details')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailItem title={t('ceph-storage-plugin~Service Name')}>
          OpenShift Container Storage
        </DetailItem>
        <DetailItem
          title={t('ceph-storage-plugin~Cluster Name')}
          error={!!ocsError}
          isLoading={!ocsLoaded}
          data-test-id="cluster-name"
        >
          {ocsName}
        </DetailItem>
        <DetailItem
          title={t('ceph-storage-plugin~Provider')}
          error={!!infrastructureError || (infrastructure && !infrastructurePlatform)}
          isLoading={!infrastructureLoaded}
        >
          {infrastructurePlatform}
        </DetailItem>
        <DetailItem title={t('ceph-storage-plugin~Mode')}>External</DetailItem>
        <DetailItem
          title={t('ceph-storage-plugin~Version')}
          isLoading={!subscriptionLoaded}
          error={!!subscriptionError}
          data-test-id="cluster-subscription"
        >
          {subscriptionVersion}
        </DetailItem>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DetailsCard);
