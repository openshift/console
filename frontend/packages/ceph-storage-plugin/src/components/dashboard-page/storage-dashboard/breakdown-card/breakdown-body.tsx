import * as React from 'react';
import { EmptyState, EmptyStateVariant, Grid, GridItem, Title } from '@patternfly/react-core';
import { Humanize } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { addAvailable, getCapacityValue, StackDataPoint } from './utils';
import { BreakdownChart } from './breakdown-chart';
import { BreakdownChartLoading } from './breakdown-loading';
import { TotalCapacityBody } from './breakdown-capacity';

export const BreakdownCardBody: React.FC<BreakdownBodyProps> = ({
  cephUsed,
  cephTotal,
  humanize,
  isLoading,
  metricModel,
  metricTotal,
  top5MetricsStats,
}) => {
  if (isLoading) {
    return <BreakdownChartLoading />;
  }
  if (!cephUsed || !cephTotal || !metricTotal || !top5MetricsStats.length) {
    return (
      <EmptyState variant={EmptyStateVariant.full}>
        <Title className="graph-empty-state__title text-secondary" size="sm">
          Not available.
        </Title>
      </EmptyState>
    );
  }

  const available = getCapacityValue(cephUsed, cephTotal, humanize);
  const usedCapacity = `${humanize(cephUsed).string} used of ${humanize(cephTotal).string}`;
  const availableCapacity = `${available.string} available`;

  const chartData = addAvailable(top5MetricsStats, cephTotal, cephUsed, metricTotal, humanize);

  const legends = chartData.map((d: StackDataPoint) => ({
    name: [d.name, d.label],
    symbol: { size: 3, padding: 0 }, // To be removed
    labels: { fill: d.color, padding: 0 },
    link: d.link,
  }));

  legends.pop(); // Removes Legend for available

  return (
    <Grid>
      <GridItem span={4}>
        <TotalCapacityBody value={usedCapacity} />
      </GridItem>
      <GridItem span={4} />
      <GridItem span={4}>
        <TotalCapacityBody
          value={availableCapacity}
          className="capacity-breakdown-card__available-body text-secondary"
        />
      </GridItem>
      <GridItem span={12}>
        <BreakdownChart data={chartData} legends={legends} metricModel={metricModel} />
      </GridItem>
    </Grid>
  );
};

type BreakdownBodyProps = {
  isLoading: boolean;
  metricTotal: string;
  top5MetricsStats: StackDataPoint[];
  cephUsed: string;
  cephTotal: string;
  metricModel: K8sKind;
  humanize: Humanize;
};
