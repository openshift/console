import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
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
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Pool name')}>
            {obj.metadata?.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Volume type')}>
            {volumeType}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Replicas')}>
            {obj.spec?.replicated?.size}
          </DetailItem>
        </DetailsBody>
      </CardBody>
    </Card>
  );
};
