import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardActions, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { StorageDashboardQuery, INDEPENDENT_UTILIZATION_QUERIES } from '../../../queries';

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ceph-storage-plugin~Utilization')}</CardTitle>
        <CardActions>
          <UtilizationDurationDropdown />
        </CardActions>
      </CardHeader>
      <CardBody>
        <UtilizationBody>
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Used Capacity')}
            utilizationQuery={INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.USED_CAPACITY]}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
          />
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Requested capacity')}
            utilizationQuery={
              INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.REQUESTED_CAPACITY]
            }
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
          />
        </UtilizationBody>
      </CardBody>
    </Card>
  );
};

export default UtilizationCard;
