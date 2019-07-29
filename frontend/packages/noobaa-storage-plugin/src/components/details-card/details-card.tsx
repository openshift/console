import * as React from 'react';
import * as _ from 'lodash';
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
import { FirehoseResource } from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CephClusterModel } from '../../../../ceph-storage-plugin/src/models';

const getInfrastructurePlatform = (infrastructure: K8sResourceKind): string =>
  _.get(infrastructure, 'status.platform');

const getCephVersion = (cephCluster: K8sResourceKind): string =>
  _.get(cephCluster, 'spec.cephVersion.image');

const NOOBAA_SYSTEM_NAME_QUERY = 'NooBaa_system_info';

const cephClusterResource: FirehoseResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: true,
  namespace: 'openshift-storage',
  name: 'rook-ceph',
  isList: false,
  prop: 'ceph',
};

const infrastructureResource: FirehoseResource = {
  kind: referenceForModel(InfrastructureModel),
  namespaced: false,
  name: 'cluster',
  isList: false,
  prop: 'infrastructure',
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
    watchK8sResource(cephClusterResource);
    watchK8sResource(infrastructureResource);
    watchPrometheus(NOOBAA_SYSTEM_NAME_QUERY);
    return () => {
      stopWatchK8sResource(cephClusterResource);
      stopWatchK8sResource(infrastructureResource);
      stopWatchPrometheusQuery(NOOBAA_SYSTEM_NAME_QUERY);
    };
  }, [watchK8sResource, stopWatchK8sResource, watchPrometheus, stopWatchPrometheusQuery]);

  const queryResult = prometheusResults.getIn([NOOBAA_SYSTEM_NAME_QUERY, 'result']);

  const systemName = _.get(queryResult, 'data.result[0].metric.system_name');

  const infrastructure = _.get(resources, 'infrastructure');
  const infrastructureLoaded = _.get(infrastructure, 'loaded', false);
  const infrastructureData = _.get(infrastructure, 'data') as K8sResourceKind;

  const cephCluster = _.get(resources, 'ceph');
  const cephClusterLoaded = _.get(cephCluster, 'loaded', false);
  const cephClusterData = _.get(cephCluster, 'data') as K8sResourceKind;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Service Details</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem key="name" title="Name" value={systemName} isLoading={!queryResult} />
          <DetailItem
            key="provider"
            title="Provider"
            value={getInfrastructurePlatform(infrastructureData)}
            isLoading={!infrastructureLoaded}
          />
          <DetailItem
            key="version"
            title="Version"
            value={getCephVersion(cephClusterData)}
            isLoading={!cephClusterLoaded}
          />
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const DetailsCard = withDashboardResources(ObjectServiceDetailsCard);
