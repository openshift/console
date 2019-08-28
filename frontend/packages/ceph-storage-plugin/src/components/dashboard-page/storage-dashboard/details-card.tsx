import * as React from 'react';
import * as _ from 'lodash';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { DetailItem } from '@console/internal/components/dashboard/details-card/detail-item';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { DetailsBody } from '@console/internal/components/dashboard/details-card/details-body';
import { FirehoseResource } from '@console/internal/components/utils/index';
import { InfrastructureModel, SubscriptionModel } from '@console/internal/models/index';
import { K8sResourceKind } from '@console/internal/module/k8s/index';
import { getName } from '@console/shared/src/selectors/common';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { CephClusterModel } from '../../../models';
import { getInfrastructurePlatform } from '../../../selectors';

const infrastructureResource: FirehoseResource = {
  kind: referenceForModel(InfrastructureModel),
  namespaced: false,
  name: 'cluster',
  isList: false,
  prop: 'infrastructure',
};

const cephClusterResource: FirehoseResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
  prop: 'ceph',
};

const SubscriptionResource: FirehoseResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subscription',
  name: 'ocs-subscription',
  isList: false,
};

const DetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  React.useEffect(() => {
    watchK8sResource(cephClusterResource);
    watchK8sResource(infrastructureResource);
    watchK8sResource(SubscriptionResource);
    return () => {
      stopWatchK8sResource(cephClusterResource);
      stopWatchK8sResource(infrastructureResource);
      stopWatchK8sResource(SubscriptionResource);
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const infrastructure = _.get(resources, 'infrastructure');
  const infrastructureLoaded = _.get(infrastructure, 'loaded', false);
  const infrastructureData = _.get(infrastructure, 'data') as K8sResourceKind;
  const infrastructurePlatform = getInfrastructurePlatform(infrastructureData);

  const cephCluster = _.get(resources, 'ceph');
  const cephClusterLoaded = _.get(cephCluster, 'loaded', false);
  const cephClusterData = _.get(cephCluster, 'data') as K8sResourceKind[];
  const cephClusterName = getName(_.get(cephClusterData, 0));

  const subscription = _.get(resources, 'subscription');
  const subscriptionLoaded = _.get(subscription, 'loaded');
  const ocsVersion = _.get(subscription, 'data.status.currentCSV');

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
            error={!cephClusterName}
            isLoading={!cephClusterLoaded}
          >
            {cephClusterName}
          </DetailItem>
          <DetailItem
            key="provider"
            title="Provider"
            error={!infrastructurePlatform}
            isLoading={!infrastructureLoaded}
          >
            {infrastructurePlatform}
          </DetailItem>
          <DetailItem
            key="version"
            title="Version"
            isLoading={!subscriptionLoaded}
            error={!ocsVersion}
          >
            {ocsVersion}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DetailsCard);
