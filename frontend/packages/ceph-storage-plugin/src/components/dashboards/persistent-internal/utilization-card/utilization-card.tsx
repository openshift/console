// TODO (@rexagod): https://github.com/openshift/console/pull/10470#discussion_r766453369
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardActions, CardHeader, CardTitle } from '@patternfly/react-core';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  FieldLevelHelp,
} from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { humanizeIOPS, humanizeLatency } from './utils';
import { PrometheusUtilizationItem } from './prometheus-utilization-item';
import { PrometheusMultilineUtilizationItem } from './prometheus-multi-utilization-item';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  utilizationPopoverQueryMap,
} from '../../../../queries';

import './utilization-card.scss';

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const storagePopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title={t('ceph-storage-plugin~Used Capacity')}
        current={current}
        consumers={utilizationPopoverQueryMap}
        humanize={humanizeBinaryBytes}
      />
    ),
    [t],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('ceph-storage-plugin~Utilization')}
          <FieldLevelHelp>
            {t(
              'ceph-storage-plugin~Performance metrics over time showing IOPS, Latency and more. Each metric is a link to a detailed view of this metric.',
            )}
          </FieldLevelHelp>
        </CardTitle>
        <CardActions>
          <UtilizationDurationDropdown />
        </CardActions>
      </CardHeader>
      <UtilizationBody>
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Used Capacity')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
        />
        <PrometheusMultilineUtilizationItem
          title={t('ceph-storage-plugin~IOPS')}
          queries={[
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_READ_QUERY],
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_WRITE_QUERY],
          ]}
          humanizeValue={humanizeIOPS}
          chartType="stacked-area"
        />
        <PrometheusMultilineUtilizationItem
          title={t('ceph-storage-plugin~Throughput')}
          queries={[
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_READ_QUERY],
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_WRITE_QUERY],
          ]}
          humanizeValue={humanizeDecimalBytesPerSec}
          chartType="stacked-area"
        />
        <PrometheusMultilineUtilizationItem
          title={t('ceph-storage-plugin~Latency')}
          queries={[
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_READ_QUERY],
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_WRITE_QUERY],
          ]}
          humanizeValue={humanizeLatency}
          chartType="grouped-line"
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Recovery')}
          utilizationQuery={
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]
          }
          humanizeValue={humanizeDecimalBytesPerSec}
        />
      </UtilizationBody>
    </Card>
  );
};

export default UtilizationCard;
