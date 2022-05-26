import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DonutChart } from '@console/internal/components/graphs/donut';
import { AppliedClusterResourceQuotaKind } from '@console/internal/module/k8s';
import { getUsedPercentage, getLabelAndUsage } from './utils';

import './resource-quota.scss';

type AppliedClusterResourceQuotaChartsProps = {
  appliedClusterResourceQuota: AppliedClusterResourceQuotaKind;
  namespace: string;
};

const AppliedClusterResourceQuotaCharts = ({
  appliedClusterResourceQuota,
  namespace,
}: AppliedClusterResourceQuotaChartsProps): JSX.Element => {
  const { t } = useTranslation();
  const nsQuotas = appliedClusterResourceQuota.status?.namespaces?.find(
    (ns) => ns.namespace === namespace,
  );

  const charts = Object.keys(nsQuotas?.status?.hard ?? {}).map((resourceName) => {
    const clusterHard = appliedClusterResourceQuota.status.total?.hard?.[resourceName];
    const clusterUsed = appliedClusterResourceQuota.status.total?.used?.[resourceName];
    const nsUsed = nsQuotas.status.used?.[resourceName];
    const clusterUsage = getUsedPercentage(clusterHard, clusterUsed);
    const unused = 100 - clusterUsage;

    const { label, percent: nsUsage } = getLabelAndUsage({
      resourceName,
      used: nsUsed,
      hard: clusterHard,
    });

    const percentOtherNamespaces = clusterUsage - nsUsage;

    return (
      <div
        key={resourceName}
        className="co-resource-quota__chart"
        data-test="resource-quota-gauge-chart"
      >
        <DonutChart
          data={[
            {
              x: 'Namespace',
              y: nsUsage,
            },
            {
              x: 'Other namespaces',
              y: percentOtherNamespaces,
            },
            {
              x: 'Unused',
              y: unused,
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

export default AppliedClusterResourceQuotaCharts;
