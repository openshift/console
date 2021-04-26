import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, GridItem } from '@patternfly/react-core';
import { Humanize } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { addAvailable, StackDataPoint, getLegends } from './utils';
import { BreakdownChart, LabelPadding } from './breakdown-chart';
import { BreakdownChartLoading } from './breakdown-loading';
import { TotalCapacityBody } from './breakdown-capacity';

export const BreakdownCardBody: React.FC<BreakdownBodyProps> = ({
  top5MetricsStats,
  metricTotal,
  capacityUsed,
  capacityAvailable,
  metricModel,
  humanize,
  isLoading,
  hasLoadError,
  ocsVersion = '',
  labelPadding,
}) => {
  const { t } = useTranslation();

  if (isLoading && !hasLoadError) {
    return <BreakdownChartLoading />;
  }
  if (!capacityUsed || !top5MetricsStats.length || hasLoadError) {
    return (
      <div className="text-secondary capacity-breakdown-card--error">
        {t('ceph-storage-plugin~Not available')}
      </div>
    );
  }
  if (capacityUsed === '0') {
    return (
      <div className="text-secondary capacity-breakdown-card--error">
        {t('ceph-storage-plugin~Not enough usage data')}
      </div>
    );
  }

  const chartData = addAvailable(top5MetricsStats, capacityAvailable, metricTotal, humanize, t);

  const legends = getLegends(chartData);

  // Removes Legend for available
  if (capacityAvailable) {
    legends.pop();
  }

  return (
    <Grid>
      <GridItem span={4}>
        <TotalCapacityBody
          capacity={humanize(capacityUsed).string}
          suffix={t('ceph-storage-plugin~used')}
        />
      </GridItem>
      <GridItem span={4} />
      <GridItem span={4}>
        {capacityAvailable && (
          <TotalCapacityBody
            capacity={humanize(capacityAvailable).string}
            suffix={t('ceph-storage-plugin~available')}
            className="capacity-breakdown-card__available-body text-secondary"
          />
        )}
      </GridItem>
      <GridItem span={12}>
        <BreakdownChart
          data={chartData}
          legends={legends}
          metricModel={metricModel}
          ocsVersion={ocsVersion}
          labelPadding={labelPadding}
        />
      </GridItem>
    </Grid>
  );
};

export type BreakdownBodyProps = {
  isLoading: boolean;
  hasLoadError: boolean;
  metricTotal: string;
  top5MetricsStats: StackDataPoint[];
  capacityUsed: string;
  capacityAvailable?: string;
  metricModel: K8sKind;
  humanize: Humanize;
  ocsVersion?: string;
  labelPadding?: LabelPadding;
};
