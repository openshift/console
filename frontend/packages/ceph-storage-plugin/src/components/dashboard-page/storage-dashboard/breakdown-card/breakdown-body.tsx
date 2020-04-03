import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { Humanize } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { addAvailable, getCapacityValue, StackDataPoint, getLegends } from './utils';
import { BreakdownChart } from './breakdown-chart';
import { BreakdownChartLoading } from './breakdown-loading';
import { TotalCapacityBody } from './breakdown-capacity';

export const BreakdownCardBody: React.FC<BreakdownBodyProps> = ({
  top5MetricsStats,
  metricTotal,
  capacityUsed,
  capacityTotal,
  metricModel,
  humanize,
  isLoading,
  hasLoadError,
  ocsVersion = '',
}) => {
  if (isLoading && !hasLoadError) {
    return <BreakdownChartLoading />;
  }
  if (!capacityUsed || !top5MetricsStats.length || hasLoadError) {
    return <div className="text-secondary">Not available</div>;
  }
  if (capacityUsed === '0') {
    return <div className="text-secondary">Not enough usage data</div>;
  }

  const available = getCapacityValue(capacityUsed, capacityTotal, humanize);
  const usedCapacity = `${humanize(capacityUsed, null, 'GiB').string} used${
    capacityTotal ? ` of ${humanize(capacityTotal).string}` : ''
  }`;
  const availableCapacity = `${available.string} available`;

  const chartData = addAvailable(
    top5MetricsStats,
    capacityTotal,
    capacityUsed,
    metricTotal,
    humanize,
  );

  const legends = getLegends(chartData);

  // Removes Legend for available
  if (capacityTotal) {
    legends.pop();
  }

  return (
    <Grid>
      <GridItem span={4}>
        <TotalCapacityBody value={usedCapacity} />
      </GridItem>
      <GridItem span={4} />
      <GridItem span={4}>
        {capacityTotal && (
          <TotalCapacityBody
            value={availableCapacity}
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
  capacityTotal?: string;
  metricModel: K8sKind;
  humanize: Humanize;
  ocsVersion?: string;
};
