import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import { BlueArrowCircleUpIcon, getInfrastructurePlatform } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils/index';
import { InfrastructureModel } from '@console/internal/models/index';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  PackageManifestModel,
} from '@console/operator-lifecycle-manager/src/models';
import { K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s/index';
import { getName } from '@console/shared/src/selectors/common';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import {
  PackageManifestKind,
  SubscriptionKind,
} from '@console/operator-lifecycle-manager/src/types';
import { createSubscriptionChannelModal } from '@console/operator-lifecycle-manager/src/components/modals/subscription-channel-modal';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { Button } from '@patternfly/react-core';
import { OCSServiceModel } from '../../../models';
import { getOCSVersion } from '../../../selectors';
import { CEPH_STORAGE_NAMESPACE } from '../../../constants';
import { StorageClusterKind } from '../../../types';

const ocsResource: FirehoseResource = {
  kind: referenceForModel(OCSServiceModel),
  namespaced: true,
  isList: true,
  namespace: CEPH_STORAGE_NAMESPACE,
  prop: 'ocs',
};

const SubscriptionResource: FirehoseResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subscription',
  isList: true,
};

const ocsSubscriptionResource: FirehoseResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: true,
  namespace: 'openshift-storage',
  prop: 'subscription',
  isList: false,
  name: 'ocs-operator',
};

const PackageManifestResource: FirehoseResource = {
  kind: referenceForModel(PackageManifestModel),
  namespaced: true,
  isList: false,
  namespace: 'openshift-storage',
  prop: 'packages',
  name: 'ocs-operator',
};

const DetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  const [ocsSubscription, ocsSubscriptionLoaded, ocsSubscriptionError] = useK8sWatchResource<
    SubscriptionKind
  >(ocsSubscriptionResource);
  const [packageManifest, packageManifestLoaded, packageManifestError] = useK8sWatchResource<
    PackageManifestKind
  >(PackageManifestResource);

  const currentChannel =
    ocsSubscription?.spec?.channel ?? packageManifest?.status?.channels?.[0]?.name;
  const filteredVersions = packageManifest?.status?.channels?.filter(
    (channel) =>
      parseFloat(channel.name.substring(channel.name.indexOf('-') + 1)) >
      parseFloat(currentChannel.substring(currentChannel.indexOf('-') + 1)),
  );
  _.set(packageManifest, 'status.channels', filteredVersions);

  React.useEffect(() => {
    watchK8sResource(SubscriptionResource);
    watchK8sResource(ocsResource);
    return () => {
      stopWatchK8sResource(SubscriptionResource);
      stopWatchK8sResource(ocsResource);
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const infrastructurePlatform = getInfrastructurePlatform(infrastructure);
  const ocs = resources?.ocs;
  const ocsLoaded = ocs?.loaded || false;
  const ocsError = ocs?.loadError;
  const ocsData = ocs?.data as K8sResourceKind[];
  const cluster = ocsData?.find((item: StorageClusterKind) => item.status.phase !== 'Ignored');
  const ocsName = getName(cluster);

  const subscription = resources?.subscription as FirehoseResult;
  const subscriptionLoaded = subscription?.loaded;
  const ocsVersion = getOCSVersion(subscription);
  const ocsPath = `${resourcePathFromModel(
    ClusterServiceVersionModel,
    ocsVersion,
    CEPH_STORAGE_NAMESPACE,
  )}`;
  const updateFunction = (...args) => k8sUpdate(...args);
  const launchModal = () => {
    if (!ocsSubscriptionError && !packageManifestError && packageManifestLoaded) {
      return createSubscriptionChannelModal({
        subscription: ocsSubscription,
        pkg: packageManifest,
        k8sUpdate: updateFunction,
      });
    }
    return 0;
  };
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Details')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem
            key="service_name"
            title={t('ceph-storage-plugin~Service Name')}
            isLoading={false}
            error={false}
          >
            <Link to={ocsPath}>OpenShift Container Storage</Link>
          </DetailItem>
          <DetailItem
            key="cluster_name"
            title={t('ceph-storage-plugin~Cluster Name')}
            error={!!ocsError}
            isLoading={!ocsLoaded}
          >
            {ocsName}
          </DetailItem>
          <DetailItem
            key="provider"
            title={t('ceph-storage-plugin~Provider')}
            error={!!infrastructureError || (infrastructure && !infrastructurePlatform)}
            isLoading={!infrastructureLoaded}
          >
            {infrastructurePlatform}
          </DetailItem>
          <DetailItem title={t('ceph-storage-plugin~Mode')}>Internal</DetailItem>
          {!isEmpty(filteredVersions) && ocsSubscription?.spec?.installPlanApproval === 'Manual' ? (
            <DetailItem
              key="version"
              title={t('ceph-storage-plugin~Version')}
              isLoading={!subscriptionLoaded}
              error={subscriptionLoaded && !ocsVersion}
            >
              {ocsVersion}
              {ocsSubscriptionLoaded && packageManifestLoaded ? (
                <Button type="button" isInline onClick={launchModal} variant="link">
                  <BlueArrowCircleUpIcon className="co-icon-space-r" />
                  {ocsSubscriptionLoaded ? ocsSubscription?.spec?.channel : null}
                </Button>
              ) : null}
            </DetailItem>
          ) : (
            <DetailItem
              key="version"
              title={t('ceph-storage-plugin~Version')}
              isLoading={!subscriptionLoaded}
              error={subscriptionLoaded && !ocsVersion}
            >
              {ocsVersion}
            </DetailItem>
          )}
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DetailsCard);
