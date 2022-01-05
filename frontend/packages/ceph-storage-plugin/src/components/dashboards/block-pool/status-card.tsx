import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Status } from '@console/shared';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';

export const StatusCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);

  return (
    <Card data-test-id="status-card">
      <CardHeader>
        <CardTitle>{t('ceph-storage-plugin~Status')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <Status status={obj.status?.phase} />
        </DetailsBody>
      </CardBody>
    </Card>
  );
};
