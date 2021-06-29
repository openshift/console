import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BlueArrowCircleUpIcon,
  getInfrastructurePlatform,
  useFlag,
  useDeepCompareMemoize,
} from '@console/shared';
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
  InstallPlanModel,
} from '@console/operator-lifecycle-manager/src/models';
import { K8sKind, K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s/index';
import { getName } from '@console/shared/src/selectors/common';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import {
  PackageManifestKind,
  SubscriptionKind,
  InstallPlanKind,
} from '@console/operator-lifecycle-manager/src/types';
import { createSubscriptionChannelModal } from '@console/operator-lifecycle-manager/src/components/modals/subscription-channel-modal';
import { installPlanForSubscription } from '@console/operator-lifecycle-manager/src/components/subscription';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { Button } from '@patternfly/react-core';
import { OCSServiceModel } from '../../../models';
import { getOCSVersion, getODFVersion } from '../../../selectors';
import { CEPH_STORAGE_NAMESPACE, ODF_MODEL_FLAG } from '../../../constants';
import { StorageClusterKind } from '../../../types';
import './details-card.scss';

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

const ocsSubscriptionResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: true,
  namespace: 'openshift-storage',
  isList: false,
  name: 'ocs-operator',
};

const InstallPlanResource = {
  kind: referenceForModel(InstallPlanModel),
  namespaced: true,
  isList: true,
  namespace: 'openshift-storage',
};

const PackageManifestResource = {
  kind: referenceForModel(PackageManifestModel),
  namespaced: true,
  isList: false,
  namespace: 'openshift-storage',
  name: 'ocs-operator',
};

const DetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();
  const isODF = useFlag(ODF_MODEL_FLAG);

  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  const [ocsSubscription, ocsSubscriptionLoaded, ocsSubscriptionError] = useK8sWatchResource<
    SubscriptionKind
  >(ocsSubscriptionResource);
  const [installPlans, installPlansLoaded, installPlansError] = useK8sWatchResource<
    InstallPlanKind[]
  >(InstallPlanResource);
  const [packageManifest, packageManifestLoaded, packageManifestError] = useK8sWatchResource<
    PackageManifestKind
  >(PackageManifestResource);

  const isSafe =
    !ocsSubscriptionError &&
    ocsSubscriptionLoaded &&
    !packageManifestError &&
    packageManifestLoaded &&
    !installPlansError &&
    installPlansLoaded;
  const memoizedPackageManifest = useDeepCompareMemoize(packageManifest, true);
  const memoizedOcsSubscription = useDeepCompareMemoize(ocsSubscription, true);
  const installPlan = installPlanForSubscription(installPlans, memoizedOcsSubscription);
  const plan = installPlan?.status?.plan || [];
  const previousInstallPlan = React.useRef<string>('');
  let currentChannel: string;
  let currentChannelVersion: number;

  if (ocsSubscriptionLoaded && packageManifestLoaded) {
    currentChannel =
      memoizedOcsSubscription?.spec?.channel ??
      memoizedPackageManifest?.status?.channels?.[0]?.name;
    currentChannelVersion = parseFloat(
      currentChannel.substring(currentChannel.lastIndexOf('-') + 1),
    );
  }

  const filteredVersions = memoizedPackageManifest?.status?.channels?.filter(
    ({ name }) => parseFloat(name.substring(name.lastIndexOf('-') + 1)) > currentChannelVersion,
  );
  _.set(memoizedPackageManifest, 'status.channels', filteredVersions);
  const ocsChannelsList = memoizedPackageManifest?.status?.channels;

  // plan.length <= 0 means InstallPlan has not been fully resolved yet.
  if (isSafe && plan.length > 0 && previousInstallPlan.current !== installPlan?.metadata?.name) {
    if (previousInstallPlan.current && !installPlan?.spec?.approved) {
      k8sUpdate(InstallPlanModel, {
        ...installPlan,
        spec: { ...installPlan.spec, approved: true },
      });
    }
    previousInstallPlan.current = installPlan.metadata.name;
  }

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
  const serviceVersion = !isODF ? getOCSVersion(subscription) : getODFVersion(subscription);
  const servicePath = `${resourcePathFromModel(
    ClusterServiceVersionModel,
    serviceVersion,
    CEPH_STORAGE_NAMESPACE,
  )}`;

  const serviceName = isODF
    ? t('ceph-storage-plugin~OpenShift Data Foundation')
    : t('ceph-storage-plugin~OpenShift Container Storage');

  const launchModal = () => {
    if (isSafe) {
      return createSubscriptionChannelModal({
        subscription: memoizedOcsSubscription,
        pkg: memoizedPackageManifest,
        k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => k8sUpdate(kind, newObj),
      });
    }
    return null;
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
            title={t('ceph-storage-plugin~Service name')}
            isLoading={false}
            error={false}
          >
            <Link data-test="ocs-link" to={servicePath}>
              {serviceName}
            </Link>
          </DetailItem>
          <DetailItem
            key="cluster_name"
            title={t('ceph-storage-plugin~Cluster name')}
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
          <DetailItem title={t('ceph-storage-plugin~Mode')}>
            {t('ceph-storage-plugin~Internal')}
          </DetailItem>
          <DetailItem
            key="version"
            title={t('ceph-storage-plugin~Version')}
            isLoading={!subscriptionLoaded}
            error={subscriptionLoaded && !serviceVersion}
          >
            <div className="ceph-details-card__version-details">
              <div>{serviceVersion}</div>
              <div className="ceph-details-card__update-version">
                {!_.isEmpty(filteredVersions) &&
                  memoizedOcsSubscription?.spec?.installPlanApproval === 'Manual' && (
                    <>
                      {ocsSubscriptionLoaded && packageManifestLoaded && installPlansLoaded && (
                        <Button
                          type="button"
                          isInline
                          onClick={launchModal}
                          variant="link"
                          className="pf-u-ml-xl"
                        >
                          <BlueArrowCircleUpIcon className="co-icon-space-r" />
                          {t('ceph-storage-plugin~Update to ')}
                          {ocsChannelsList[ocsChannelsList.length - 1].name}
                        </Button>
                      )}
                    </>
                  )}
              </div>
            </div>
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DetailsCard);
