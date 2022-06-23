import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DonutChart } from '@console/internal/components/graphs/donut';
import { ClusterResourceQuotaKind } from '@console/internal/module/k8s';
import { getLabelAndUsage } from './utils';

import './resource-quota.scss';

type ClusterResourceQuotaChartsProps = {
  clusterResourceQuota: ClusterResourceQuotaKind;
};

const ClusterResourceQuotaCharts = ({
  clusterResourceQuota,
}: ClusterResourceQuotaChartsProps): JSX.Element => {
  const { t } = useTranslation();
  const charts = Object.keys(clusterResourceQuota.status?.total?.hard ?? {}).map((resourceName) => {
    const clusterHard = clusterResourceQuota.status.total.hard[resourceName];
    const clusterUsed = clusterResourceQuota.status.total.used?.[resourceName];

    const { label, percent } = getLabelAndUsage({
      resourceName,
      used: clusterUsed,
      hard: clusterHard,
    });

    return (
      <div
        key={resourceName}
        className="co-resource-quota__chart"
        data-test="resource-quota-gauge-chart"
      >
        <DonutChart
          data={[
            {
              x: 'Used',
              y: percent,
            },
            {
              x: 'Unused',
              y: 100 - percent,
            },
          ]}
          title={resourceName}
          label={label}
        />
      </div>
    );
  });

  return (
    <div className="co-resource-quota-chart-row">
      {charts.length ? charts : <>{t('console-app~No quota')}</>}
    </div>
  );
};

export default ClusterResourceQuotaCharts;
