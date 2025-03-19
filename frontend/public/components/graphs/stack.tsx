import * as React from 'react';
import {
  ChartArea,
  ChartAxis,
  ChartVoronoiContainer,
  Chart,
  ChartStack,
  ChartThemeColor,
  getCustomTheme,
} from '@patternfly/react-charts/victory';
import { processFrame, ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { timeFormatter } from '../utils/datetime';
import { humanizeNumber, useRefWidth } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { DataPoint, CursorVoronoiContainer, PrometheusResult } from './';
import { getRangeVectorStats } from './utils';
import { GraphEmpty } from './graph-empty';
import { ChartLegendTooltip } from './tooltip';
import { areaTheme } from './themes';
import { AreaChart, AreaChartProps } from './area';

const DEFAULT_HEIGHT = 180;
const DEFAULT_SAMPLES = 60;
const DEFAULT_TICK_COUNT = 2;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const StackChart: React.FC<AreaChartProps> = ({
  className,
  data = [],
  formatDate = timeFormatter.format,
  height = DEFAULT_HEIGHT,
  humanize = humanizeNumber,
  loading = true,
  padding,
  query,
  tickCount = DEFAULT_TICK_COUNT,
  title,
  ariaChartLinkLabel,
  ariaChartTitle,
  xAxis = true,
  yAxis = true,
  chartStyle,
  byteDataType = '',
  mainDataName,
}) => {
  const theme = getCustomTheme(ChartThemeColor.multiUnordered, areaTheme);
  const [containerRef, width] = useRefWidth();

  const [processedData, unit] = React.useMemo(() => {
    if (byteDataType) {
      const result = processFrame(data, byteDataType);
      return [result.processedData, result.unit];
    }
    return [data, ''];
  }, [byteDataType, data]);

  const tickFormat = React.useCallback((tick) => `${humanize(tick, unit, unit).string}`, [
    humanize,
    unit,
  ]);

  const getLabel = React.useCallback(
    (prop, includeDate = true) => {
      const { x, y } = prop.datum as DataPoint<Date>;
      const value = humanize(y, unit, unit).string;
      const date = formatDate(x);
      return includeDate ? `${value} at ${date}` : `${value} -`;
    },
    [humanize, unit, formatDate],
  );

  const multiLine = processedData?.length > 1;

  const container = React.useMemo(() => {
    if (multiLine) {
      const legendData = processedData.map((d) => ({
        childName: d[0]?.description,
        name: d[0]?.description,
        symbol: d[0]?.symbol,
      }));
      return (
        <CursorVoronoiContainer
          activateData={false}
          cursorDimension="x"
          labels={(props) => getLabel(props, false)}
          labelComponent={
            <ChartLegendTooltip
              legendData={legendData}
              stack
              formatDate={(d) => {
                const y = d.reduce((acc, curr) => acc + curr.y, 0);
                const value = humanize(y, unit, unit).string;
                return `${value} total at ${formatDate(d[0].x)}`;
              }}
              mainDataName={mainDataName}
            />
          }
          voronoiDimension="x"
        />
      );
    }
    return <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} activateData={false} />;
  }, [formatDate, getLabel, humanize, mainDataName, multiLine, processedData, unit]);

  return (
    <PrometheusGraph className={className} ref={containerRef} title={title}>
      <PrometheusGraphLink query={query} ariaChartLinkLabel={ariaChartLinkLabel}>
        {data?.[0]?.length ? (
          <Chart
            ariaTitle={ariaChartTitle || title}
            containerComponent={container}
            domainPadding={{ y: 20 }}
            height={height}
            width={width}
            scale={{ x: 'time', y: 'linear' }}
            padding={padding}
            theme={theme}
          >
            {xAxis && <ChartAxis tickCount={tickCount} tickFormat={(tick) => formatDate(tick)} />}
            {yAxis && <ChartAxis dependentAxis tickCount={tickCount} tickFormat={tickFormat} />}
            <ChartStack height={height} width={width}>
              {processedData.map((datum, index) => (
                <ChartArea
                  height={height}
                  width={width}
                  key={index}
                  data={datum}
                  style={chartStyle && chartStyle[index]}
                  name={datum[0]?.description}
                />
              ))}
            </ChartStack>
          </Chart>
        ) : (
          <GraphEmpty height={height} loading={loading} />
        )}
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

export const Stack: React.FC<StackProps> = ({
  namespace,
  query,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
  description,
  ...rest
}) => {
  const [utilization, , loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  });
  const data = getRangeVectorStats(utilization, description);
  const ChartComponent = data?.length === 1 ? AreaChart : StackChart;
  return <ChartComponent data={data} loading={loading} query={query} {...rest} />;
};

type StackProps = AreaChartProps & {
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
  byteDataType?: ByteDataTypes;
  description: (result: PrometheusResult, index: number) => string;
};
