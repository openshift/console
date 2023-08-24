import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { getInfrastructurePlatform, useFlag } from '@console/shared';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
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
} from '@console/operator-lifecycle-manager/src/models';
import { K8sResourceKind } from '@console/internal/module/k8s/index';
import { getName } from '@console/shared/src/selectors/common';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { OCSServiceModel } from '../../../models';
import { getOCSVersion, getODFVersion } from '../../../selectors';
import { CEPH_STORAGE_NAMESPACE, ODF_MODEL_FLAG } from '../../../constants';
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
  const { t } = useTranslation();
  const isODF = useFlag(ODF_MODEL_FLAG);
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ceph-storage-plugin~Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <OverviewDetailItem key="service_name" title={t('ceph-storage-plugin~Service name')}>
            <Link data-test="ocs-link" to={servicePath}>
              {serviceName}
            </Link>
          </OverviewDetailItem>
          <OverviewDetailItem
            key="cluster_name"
            title={t('ceph-storage-plugin~Cluster name')}
            error={ocsError ? t('ceph-storage-plugin~Not available') : undefined}
            isLoading={!ocsLoaded}
          >
            {ocsName}
          </OverviewDetailItem>
          <OverviewDetailItem
            key="provider"
            title={t('ceph-storage-plugin~Provider')}
            error={
              !!infrastructureError || (infrastructure && !infrastructurePlatform)
                ? t('ceph-storage-plugin~Not available')
                : undefined
            }
            isLoading={!infrastructureLoaded}
          >
            {infrastructurePlatform}
          </OverviewDetailItem>
          <OverviewDetailItem title={t('ceph-storage-plugin~Mode')}>
            {t('ceph-storage-plugin~Internal')}
          </OverviewDetailItem>
          <OverviewDetailItem
            key="version"
            title={t('ceph-storage-plugin~Version')}
            isLoading={!subscriptionLoaded}
            error={
              subscriptionLoaded && !serviceVersion
                ? t('ceph-storage-plugin~Not available')
                : undefined
            }
          >
            {serviceVersion}
          </OverviewDetailItem>
        </DetailsBody>
      </CardBody>
    </Card>
  );
};

export default withDashboardResources(DetailsCard);
