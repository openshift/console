import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';

export const DetailsCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);
  const volumeType = obj.spec?.deviceClass?.toUpperCase() ?? '-';

  return (
    <Card data-test-id="details-card">
      <CardHeader>
        <CardTitle>{t('ceph-storage-plugin~Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <OverviewDetailItem isLoading={!obj} title={t('ceph-storage-plugin~Pool name')}>
            {obj.metadata?.name}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('ceph-storage-plugin~Volume type')}>
            {volumeType}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('ceph-storage-plugin~Replicas')}>
            {obj.spec?.replicated?.size}
          </OverviewDetailItem>
        </DetailsBody>
      </CardBody>
    </Card>
  );
};
