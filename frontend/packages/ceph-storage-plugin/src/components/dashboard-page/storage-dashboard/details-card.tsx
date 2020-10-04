import * as React from 'react';
import * as _ from 'lodash';
import { getInfrastructurePlatform } from '@console/shared';
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
import { SubscriptionModel } from '@console/operator-lifecycle-manager/src/models';
import { K8sResourceKind } from '@console/internal/module/k8s/index';
import { getName } from '@console/shared/src/selectors/common';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
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

const DetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
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

  const subscription = _.get(resources, 'subscription') as FirehoseResult;
  const subscriptionLoaded = _.get(subscription, 'loaded');
  const ocsVersion = getOCSVersion(subscription);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem key="service_name" title="Service Name" isLoading={false} error={false}>
            OpenShift Container Storage
          </DetailItem>
          <DetailItem
            key="cluster_name"
            title="Cluster Name"
            error={!!ocsError}
            isLoading={!ocsLoaded}
          >
            {ocsName}
          </DetailItem>
          <DetailItem
            key="provider"
            title="Provider"
            error={!!infrastructureError || (infrastructure && !infrastructurePlatform)}
            isLoading={!infrastructureLoaded}
          >
            {infrastructurePlatform}
          </DetailItem>
          <DetailItem title="Mode">Internal</DetailItem>
          <DetailItem
            key="version"
            title="Version"
            isLoading={!subscriptionLoaded}
            error={subscriptionLoaded && !ocsVersion}
          >
            {ocsVersion}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DetailsCard);
