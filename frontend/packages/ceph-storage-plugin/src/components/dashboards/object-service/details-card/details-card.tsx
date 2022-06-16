import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { getInfrastructurePlatform } from '@console/shared';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models/index';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager/src/models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { getOCSVersion, getODFVersion } from '../../../../selectors';
import { RGW_FLAG } from '../../../../features';
import { CEPH_STORAGE_NAMESPACE, ODF_MODEL_FLAG } from '../../../../constants';
import { getMetric } from '../../../../utils';
import './details-card.scss';

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
  const { t } = useTranslation();
  const isODF = useFlag(ODF_MODEL_FLAG);
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

  const systemName = getMetric(systemResult, 'system_name');

  const infrastructurePlatform = getInfrastructurePlatform(infrastructure);

  const subscription = _.get(resources, 'subscription') as FirehoseResult;
  const subscriptionLoaded = _.get(subscription, 'loaded');
  const serviceVersion = !isODF ? getOCSVersion(subscription) : getODFVersion(subscription);

  const serviceName = isODF
    ? t('ceph-storage-plugin~OpenShift Data Foundation')
    : t('ceph-storage-plugin~OpenShift Container Storage');

  const hasRGW = useFlag(RGW_FLAG);
  const servicePath = `${resourcePathFromModel(
    ClusterServiceVersionModel,
    serviceVersion,
    CEPH_STORAGE_NAMESPACE,
  )}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ceph-storage-plugin~Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <OverviewDetailItem key="service_name" title={t('ceph-storage-plugin~Service name')}>
            <Link to={servicePath}>{serviceName}</Link>
          </OverviewDetailItem>
          <OverviewDetailItem
            key="system_name"
            title={t('ceph-storage-plugin~System name')}
            isLoading={!systemResult || !dashboardLinkResult}
            error={
              systemLoadError || !systemName ? t('ceph-storage-plugin~Not available') : undefined
            }
          >
            <p data-test-id="system-name-mcg">
              {t('ceph-storage-plugin~Multicloud Object Gateway')}
            </p>
            {hasRGW && (
              <p
                className="ceph-details-card__rgw-system-name--margin"
                data-test-id="system-name-rgw"
              >
                {t('ceph-storage-plugin~RADOS Object Gateway')}
              </p>
            )}
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

export const DetailsCard = withDashboardResources(ObjectServiceDetailsCard);
