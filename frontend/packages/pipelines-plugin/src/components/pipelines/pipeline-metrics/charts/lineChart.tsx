import * as React from 'react';
import {
  ChartLineProps,
  ChartProps,
  Chart,
  ChartThemeColor,
  ChartAxis,
  ChartGroup,
  ChartLine,
  ChartTooltip,
  ChartScatter,
} from '@patternfly/react-charts/victory';
import * as _ from 'lodash';
import { DEFAULT_CHART_HEIGHT } from '../../const';

import './lineChart.scss';

type LineChartProps = {
  tickValues?: string[];
  hiddenSeries?: Set<number>;
  yTickFormatter?: (v: number) => string;
} & Omit<ChartLineProps, 'events'> &
  ChartProps;

export const LineChart: React.FC<LineChartProps> = ({
  data = [],
  width,
  height,
  containerComponent,
  ariaDesc,
  ariaTitle,
  themeColor,
  hiddenSeries,
  yTickFormatter,
  legendComponent,
  events,
  tickValues,
}) => {
  const domain = { x: undefined, y: undefined };
  const yTickFormat = yTickFormatter || null;
  const filteredData = _.filter(data, (values) => !!values);
  const findMin = (series) => _.minBy(series, 'y') as any;
  const findMax = (series) => _.maxBy(series, 'y') as any;
  let minY: number = findMin(filteredData.map(findMin))?.y ?? 0;
  let maxY: number = findMax(filteredData.map(findMax))?.y ?? 0;
  if (minY === 0 && maxY === 0) {
    minY = -1;
    maxY = 1;
  } else if (minY > 0 && maxY > 0) {
    minY = 0;
  } else if (minY < 0 && maxY < 0) {
    maxY = 0;
  }

  domain.y = [minY, maxY];

  const xAxisStyle = {
    tickLabels: {
      angle: 320,
      fontSize: 10,
      textAnchor: 'end',
      verticalAnchor: 'end',
      fill: 'var(--pf-t--global--text--color--regular)',
    },
  };

  const OVERLAP = 50;
  const chart = (
    <Chart
      ariaDesc={ariaDesc}
      ariaTitle={ariaTitle}
      containerComponent={containerComponent}
      height={height || DEFAULT_CHART_HEIGHT}
      domain={domain}
      events={events}
      domainPadding={{ x: 10, y: 10 }}
      padding={{
        bottom: 80,
        left: 50,
        right: 20,
        top: 30 + OVERLAP,
      }}
      themeColor={themeColor || ChartThemeColor.multiUnordered}
      width={width}
    >
      <ChartAxis style={xAxisStyle} labelComponent={<ChartTooltip />} tickValues={tickValues} />
      <ChartAxis
        dependentAxis
        showGrid
        tickCount={4}
        tickFormat={yTickFormat}
        style={{
          tickLabels: {
            fill: 'var(--pf-t--global--text--color--regular',
          },
        }}
      />
      <ChartGroup>
        {Object.values(filteredData).map((prun, index) => (
          <ChartScatter
            groupComponent={<g />}
            key={`scatter-${index}`} // eslint-disable-line react/no-array-index-key
            name={`scatter-${index}`}
            data={
              !hiddenSeries || (hiddenSeries && !hiddenSeries.has(index)) ? prun : [{ y: null }]
            }
          />
        ))}
      </ChartGroup>
      <ChartGroup>
        {Object.values(filteredData).map((prun, index) => (
          <ChartLine
            groupComponent={<g />}
            key={`line-${index}`} // eslint-disable-line react/no-array-index-key
            name={`line-${index}`}
            data={
              !hiddenSeries || (hiddenSeries && !hiddenSeries.has(index)) ? prun : [{ y: null }]
            }
          />
        ))}
      </ChartGroup>
      {legendComponent}
    </Chart>
  );

  return <div style={{ marginTop: OVERLAP * -1 }}>{chart}</div>;
};
