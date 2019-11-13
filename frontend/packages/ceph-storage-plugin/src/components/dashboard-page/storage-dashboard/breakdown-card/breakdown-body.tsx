import * as React from 'react';
import { EmptyState, EmptyStateVariant, Grid, GridItem, Title } from '@patternfly/react-core';
import { Humanize } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { addAvailable, getCapacityValue, StackDataPoint } from './utils';
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
}) => {
  if (isLoading && !hasLoadError) {
    return <BreakdownChartLoading />;
  }
  if (!capacityUsed || !top5MetricsStats.length || hasLoadError) {
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <Title className="graph-empty-state__title text-secondary" size="sm">
          Not available.
        </Title>
      </EmptyState>
    );
  }
  if (capacityUsed === '0') {
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <Title className="graph-empty-state__title text-secondary" size="sm">
          Not enough usage data
        </Title>
      </EmptyState>
    );
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

  const legends = chartData.map((d: StackDataPoint) => ({
    name: [d.name, d.label],
    labels: { fill: d.color },
    link: d.link,
  }));

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
        <BreakdownChart data={chartData} legends={legends} metricModel={metricModel} />
      </GridItem>
    </Grid>
  );
};

type BreakdownBodyProps = {
  isLoading: boolean;
  hasLoadError: boolean;
  metricTotal: string;
  top5MetricsStats: StackDataPoint[];
  capacityUsed: string;
  capacityTotal?: string;
  metricModel: K8sKind;
  humanize: Humanize;
};
