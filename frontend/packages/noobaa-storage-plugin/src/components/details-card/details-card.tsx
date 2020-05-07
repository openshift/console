import * as React from 'react';
import * as _ from 'lodash';
import { getInfrastructurePlatform } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource, ExternalLink, FirehoseResult } from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models/index';
import { SubscriptionModel } from '@console/operator-lifecycle-manager/src/models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { getOCSVersion } from '@console/ceph-storage-plugin/src/selectors';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { getMetric } from '../../utils';

const NOOBAA_SYSTEM_NAME_QUERY = 'NooBaa_system_info';
const NOOBAA_DASHBOARD_LINK_QUERY = 'NooBaa_system_links';

const SubscriptionResource: FirehoseResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subscription',
  isList: true,
};

export const ObjectServiceDetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  resources,
}) => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  React.useEffect(() => {
    watchK8sResource(SubscriptionResource);
    watchPrometheus(NOOBAA_SYSTEM_NAME_QUERY);
    watchPrometheus(NOOBAA_DASHBOARD_LINK_QUERY);
    return () => {
      stopWatchK8sResource(SubscriptionResource);
      stopWatchPrometheusQuery(NOOBAA_SYSTEM_NAME_QUERY);
      stopWatchPrometheusQuery(NOOBAA_DASHBOARD_LINK_QUERY);
    };
  }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

  const systemResult = prometheusResults.getIn([
    NOOBAA_SYSTEM_NAME_QUERY,
    'data',
  ]) as PrometheusResponse;
  const dashboardLinkResult = prometheusResults.getIn([
    NOOBAA_DASHBOARD_LINK_QUERY,
    'data',
  ]) as PrometheusResponse;
  const systemLoadError = prometheusResults.getIn([NOOBAA_SYSTEM_NAME_QUERY, 'loadError']);
  const dashboardLinkLoadError = prometheusResults.getIn([
    NOOBAA_DASHBOARD_LINK_QUERY,
    'loadError',
  ]);

  const systemName = getMetric(systemResult, 'system_name');
  const systemLink = getMetric(dashboardLinkResult, 'dashboard');

  const infrastructurePlatform = getInfrastructurePlatform(infrastructure);

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
          <DetailItem key="service_name" title="Service Name" error={false} isLoading={false}>
            OpenShift Container Storage (OCS)
          </DetailItem>
          <DetailItem
            key="system_name"
            title="System Name"
            isLoading={!systemResult || !dashboardLinkResult}
            error={systemLoadError || dashboardLinkLoadError || !systemName || !systemLink}
          >
            <ExternalLink href={systemLink} text={systemName} />
          </DetailItem>
          <DetailItem
            key="provider"
            title="Provider"
            error={!!infrastructureError || (infrastructure && !infrastructurePlatform)}
            isLoading={!infrastructureLoaded}
          >
            {infrastructurePlatform}
          </DetailItem>
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

export const DetailsCard = withDashboardResources(ObjectServiceDetailsCard);
