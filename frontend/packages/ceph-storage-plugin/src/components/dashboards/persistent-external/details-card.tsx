import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Base64 } from 'js-base64';
import { referenceForModel, SecretKind } from '@console/internal/module/k8s';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource, FirehoseResult, ExternalLink } from '@console/internal/components/utils';
import { getName, useFlag } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { SecretModel } from '@console/internal/models';
import { getOCSVersion, getODFVersion } from '../../../selectors';
import { OCSServiceModel } from '../../../models';
import { CEPH_STORAGE_NAMESPACE, CEPH_BRAND_NAME, ODF_MODEL_FLAG } from '../../../constants';

const getCephLink = (secret: SecretKind): string => {
  const data = secret?.data?.userKey;
  return data ? Base64.decode(data) : null;
};

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
  {
    kind: SecretModel.kind,
    namespace: CEPH_STORAGE_NAMESPACE,
    name: 'rook-ceph-dashboard-link',
    prop: 'cephSecret',
  },
];

export const DetailsCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();
  const isODF = useFlag(ODF_MODEL_FLAG);

  React.useEffect(() => {
    k8sResources.forEach((r) => watchK8sResource(r));
    return () => {
      k8sResources.forEach((r) => stopWatchK8sResource(r));
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const { ocs, subscription, cephSecret } = resources;
  const ocsLoaded = ocs?.loaded || false;
  const ocsError = ocs?.loadError;
  const ocsData = ocs?.data;
  const secretData = cephSecret?.data as SecretKind;
  const secretLoaded = cephSecret?.loaded || false;
  const secretError = cephSecret?.loadError;
  const ocsName = getName(ocsData?.[0]);
  const subscriptionLoaded = subscription?.loaded;
  const subscriptionError = subscription?.loadError;
  const subscriptionVersion = !isODF
    ? getOCSVersion(subscription as FirehoseResult)
    : getODFVersion(subscription as FirehoseResult);

  const serviceName = isODF
    ? t('ceph-storage-plugin~OpenShift Data Foundation')
    : t('ceph-storage-plugin~OpenShift Container Storage');
  const cephLink = getCephLink(secretData);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Details')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem title={t('ceph-storage-plugin~Service Name')}>{serviceName}</DetailItem>
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
            isLoading={!secretLoaded && !secretError}
          >
            {cephLink ? <ExternalLink href={cephLink} text={CEPH_BRAND_NAME} /> : CEPH_BRAND_NAME}
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
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DetailsCard);
