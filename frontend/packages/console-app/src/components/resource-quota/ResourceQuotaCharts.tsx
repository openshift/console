import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GaugeChart } from '@console/internal/components/graphs/gauge';
import { ResourceQuotaKind } from '@console/internal/module/k8s';
import { getLabelAndUsage } from './utils';

import './resource-quota.scss';

type ResourceQuotaChartsProps = {
  resourceQuota: ResourceQuotaKind;
};

const ResourceQuotaCharts = ({ resourceQuota }: ResourceQuotaChartsProps): JSX.Element => {
  const { t } = useTranslation();
  const charts = Object.keys(resourceQuota.status?.hard ?? {}).map((resourceName) => {
    const hard = resourceQuota.status.hard[resourceName];
    const used = resourceQuota.status.used?.[resourceName];

    const { label, percent } = getLabelAndUsage({ resourceName, used, hard });
    return (
      <div
        key={resourceName}
        className="co-resource-quota__chart"
        data-test="resource-quota-gauge-chart"
      >
        <GaugeChart
          data={{
            x: `${percent}%`,
            y: percent,
          }}
          thresholds={[{ value: 90 }, { value: 101 }]}
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

export default ResourceQuotaCharts;
