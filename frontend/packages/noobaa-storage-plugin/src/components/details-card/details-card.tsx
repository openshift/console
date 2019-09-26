import * as React from 'react';
import * as _ from 'lodash';
import { getInfrastructurePlatform } from '@console/shared';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import { DetailsBody, DetailItem } from '@console/internal/components/dashboard/details-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { FirehoseResource, ExternalLink, FirehoseResult } from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models/index';
import { SubscriptionModel } from '@console/operator-lifecycle-manager/src/models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getOCSVersion } from '@console/ceph-storage-plugin/src/selectors';
import { getMetric } from '../../utils';

const NOOBAA_SYSTEM_NAME_QUERY = 'NooBaa_system_info';

const infrastructureResource: FirehoseResource = {
  kind: referenceForModel(InfrastructureModel),
  namespaced: false,
  name: 'cluster',
  isList: false,
  prop: 'infrastructure',
};

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
  React.useEffect(() => {
    watchK8sResource(SubscriptionResource);
    watchK8sResource(infrastructureResource);
    watchPrometheus(NOOBAA_SYSTEM_NAME_QUERY);
    return () => {
      stopWatchK8sResource(SubscriptionResource);
      stopWatchK8sResource(infrastructureResource);
      stopWatchPrometheusQuery(NOOBAA_SYSTEM_NAME_QUERY);
    };
  }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

  const queryResult = prometheusResults.getIn([
    NOOBAA_SYSTEM_NAME_QUERY,
    'data',
  ]) as PrometheusResponse;
  const queryResultError = prometheusResults.getIn([NOOBAA_SYSTEM_NAME_QUERY, 'loadError']);

  const systemName = getMetric(queryResult, 'system_name');
  const systemAddress = getMetric(queryResult, 'system_address');
  const systemLink =
    systemName && systemAddress ? `${systemAddress}fe/systems/${systemName}` : undefined;

  const infrastructure = _.get(resources, 'infrastructure');
  const infrastructureLoaded = _.get(infrastructure, 'loaded', false);
  const infrastructureData = _.get(infrastructure, 'data') as K8sResourceKind;
  const infrastructurePlatform = getInfrastructurePlatform(infrastructureData);

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
            OpenShift Container Storage
          </DetailItem>
          <DetailItem
            key="system_name"
            title="System Name"
            isLoading={!queryResult}
            error={queryResultError || !systemLink}
          >
            <ExternalLink href={systemLink} text={systemName} />
          </DetailItem>
          <DetailItem
            key="provider"
            title="Provider"
            error={infrastructureLoaded && !infrastructurePlatform}
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
