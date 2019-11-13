import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartLabel,
  ChartLegend,
  ChartStack,
  ChartThemeColor,
  ChartTooltip,
} from '@patternfly/react-charts';
import { DataPoint } from '@console/internal/components/graphs';
import { K8sKind } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { isAvailableBar, getBarRadius, StackDataPoint } from './utils';
import './breakdown-card.scss';

const LinkableLegend: React.FC<LinkableLegendProps> = (props: LinkableLegendProps) => {
  const { metricModel, datum } = props;
  const href = metricModel
    ? resourcePathFromModel(metricModel, datum.link)
    : '/dashboards/object-service';
  return (
    <Link to={href} className="capacity-breakdown-card__legend-link">
      <ChartLabel
        {...props}
        lineHeight={1.2}
        style={[{ ...datum.labels, fontSize: 9 }, { fill: 'black', fontSize: 8 }]}
      />
    </Link>
  );
};

export const BreakdownChart: React.FC<BreakdownChartProps> = ({ data, legends, metricModel }) => {
  const chartData = data.map((d: StackDataPoint, index) => (
    <ChartBar
      key={d.id}
      style={{ data: { stroke: 'white', strokeWidth: 0.7, ...isAvailableBar(d.name) } }}
      cornerRadius={getBarRadius(index, data.length)}
      barWidth={18}
      padding={0}
      data={[d]}
      labelComponent={<ChartTooltip dx={0} style={{ fontSize: 8, padding: 5 }} />}
    />
  ));

  return (
    <>
      <Chart
        legendPosition="bottom-left"
        legendComponent={
          <ChartLegend
            themeColor={ChartThemeColor.multiOrdered}
            data={legends}
            y={40}
            labelComponent={<LinkableLegend metricModel={metricModel} />}
            orientation="horizontal"
            symbolSpacer={5}
            height={50}
            style={{ labels: { fontSize: 8 } }}
          />
        }
        height={60}
        padding={{
          bottom: 35,
          top: 0,
          right: 0,
          left: 0,
        }}
        themeColor={ChartThemeColor.multiOrdered}
      >
        <ChartAxis
          style={{ axis: { stroke: 'none' }, ticks: { stroke: 'none' } }}
          tickFormat={() => ''}
        />
        <ChartStack horizontal>{chartData}</ChartStack>
      </Chart>
    </>
  );
};

type BreakdownChartProps = {
  data: DataPoint[];
  legends: any[]; // TBD(afreen23): pass down normal legends
  metricModel: K8sKind;
};

type LinkableLegendProps = {
  metricModel: K8sKind;
  datum?: any;
};
