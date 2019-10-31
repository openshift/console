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
        lineHeight={1.3}
        style={[
          { ...datum.labels, fontSize: 8, padding: 0 },
          { fill: 'black', fontSize: 8, padding: 0 },
        ]}
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
      barWidth={20}
      padding={0}
      data={[d]}
      labelComponent={
        <ChartTooltip constrainToVisibleArea style={{ fontSize: 8 }} pointerOrientation="left" />
      }
    />
  ));

  return (
    <Chart
      legendPosition="bottom-left"
      domain={{ x: [0, 0] }}
      domainPadding={{ x: [0, 0] }}
      maxDomain={{ x: 0 }}
      legendComponent={
        <ChartLegend
          themeColor={ChartThemeColor.purple}
          data={legends}
          standalone={false}
          labelComponent={<LinkableLegend metricModel={metricModel} />}
          orientation="horizontal"
          symbolSpacer={5}
          gutter={-20}
          style={{ labels: { padding: 0 } }}
          padding={0}
        />
      }
      height={100}
      padding={{
        bottom: 75,
        top: 0,
      }}
      themeColor={ChartThemeColor.multiOrdered}
    >
      <ChartAxis
        style={{ axis: { stroke: 'none' }, ticks: { stroke: 'none' } }}
        tickFormat={() => ''}
      />
      <ChartStack horizontal padding={{ bottom: 0 }}>
        {chartData}
      </ChartStack>
    </Chart>
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
