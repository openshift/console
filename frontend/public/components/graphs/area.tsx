import * as React from 'react';
import * as _ from 'lodash';
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartThemeColor,
  ChartThemeVariant,
  ChartVoronoiContainer,
  getCustomTheme,
  ChartGroup,
} from '@patternfly/react-charts';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { processFrame, ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { twentyFourHourTime } from '../utils/datetime';
import { humanizeNumber, useRefWidth, Humanize } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { areaTheme } from './themes';
import { DataPoint, CursorVoronoiContainer } from './';
import { mapLimitsRequests } from './utils';
import { GraphEmpty } from './graph-empty';
import { ChartLegendTooltip } from './tooltip';

const DEFAULT_HEIGHT = 180;
const DEFAULT_SAMPLES = 60;
const DEFAULT_TICK_COUNT = 3;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export enum AreaChartStatus {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

export const chartStatusColors = {
  [AreaChartStatus.ERROR]: dangerColor.value,
  [AreaChartStatus.WARNING]: warningColor.value,
};

// @ts-ignore
export const AreaChart: React.FC<AreaChartProps> = ({
  className,
  data = [],
  formatDate = twentyFourHourTime,
  height = DEFAULT_HEIGHT,
  humanize = humanizeNumber,
  loading = true,
  padding,
  query,
  tickCount = DEFAULT_TICK_COUNT,
  title,
  xAxis = true,
  yAxis = true,
  chartStyle,
  byteDataType = '',
  showAllTooltip,
}) => {
  // Note: Victory incorrectly typed ThemeBaseProps.padding as number instead of PaddingProps
  // @ts-ignore
  const theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, areaTheme);
  const [containerRef, width] = useRefWidth();
  const { processedData, unit } = React.useMemo(() => {
    const nonEmptyDataSets = data.filter((dataSet) => dataSet?.length);
    if (byteDataType) {
      return processFrame(nonEmptyDataSets, byteDataType);
    }
    return { processedData: nonEmptyDataSets, unit: '' };
  }, [byteDataType, data]);

  // If every data point of every data set is 0, force y-domain to [0,1]
  const allZero = React.useMemo(
    () => _.every(processedData, (dataSet) => _.every(dataSet, ({ y }) => y === 0)),
    [processedData],
  );

  const tickFormat = React.useCallback((tick) => `${humanize(tick, unit, unit).string}`, [
    humanize,
    unit,
  ]);

  const getLabel = React.useCallback(
    (prop, includeDate = true) => {
      const { x, y } = prop.datum as DataPoint<Date>;
      const value = humanize(y, unit, unit).string;
      const date = formatDate(x);
      return includeDate ? `${value} at ${date}` : value;
    },
    [humanize, unit, formatDate],
  );

  const multiLine = processedData?.length > 1;

  const container = React.useMemo(() => {
    if (multiLine) {
      const legendData = processedData.map((d) => ({
        childName: d[0].description,
        name: d[0].description,
        symbol: d[0].symbol,
      }));
      return (
        <CursorVoronoiContainer
          activateData={false}
          cursorDimension="x"
          labels={(props) => getLabel(props, false)}
          labelComponent={
            <ChartLegendTooltip
              stack={showAllTooltip}
              legendData={legendData}
              title={(d) => (showAllTooltip ? formatDate(d[0].x) : getLabel({ datum: d[0] }))}
            />
          }
          voronoiDimension="x"
        />
      );
    }
    return <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} activateData={false} />;
  }, [formatDate, getLabel, multiLine, processedData, showAllTooltip]);

  return (
    <PrometheusGraph className={className} ref={containerRef}>
      {processedData?.length ? (
        <PrometheusGraphLink query={query} title={title}>
          <Chart
            containerComponent={container}
            domainPadding={{ y: 20 }}
            height={height}
            width={width}
            theme={theme}
            scale={{ x: 'time', y: 'linear' }}
            padding={padding}
            {...(allZero && { domain: { y: [0, 1] } })}
          >
            {xAxis && <ChartAxis tickCount={tickCount} tickFormat={formatDate} />}
            {yAxis && <ChartAxis dependentAxis tickCount={tickCount} tickFormat={tickFormat} />}
            <ChartGroup>
              {processedData.map((datum, index) => (
                <ChartArea
                  key={index}
                  data={datum}
                  style={chartStyle && chartStyle[index]}
                  name={datum[0]?.description}
                />
              ))}
            </ChartGroup>
          </Chart>
        </PrometheusGraphLink>
      ) : (
        <GraphEmpty height={height} loading={loading} />
      )}
    </PrometheusGraph>
  );
};

export const Area: React.FC<AreaProps> = ({
  namespace,
  query,
  limitQuery,
  requestedQuery,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
  ...rest
}) => {
  const [utilization, , utilizationLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  });
  const [limit, , limitLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query: limitQuery,
    samples,
    timeout,
    timespan,
  });
  const [requested, , requestedLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query: requestedQuery,
    samples,
    timeout,
    timespan,
  });
  const { data, chartStyle } = mapLimitsRequests(utilization, limit, requested);
  const loading =
    utilizationLoading &&
    (limitQuery ? limitLoading : true) &&
    (requestedQuery ? requestedLoading : true);
  return (
    <AreaChart data={data} loading={loading} query={query} chartStyle={chartStyle} {...rest} />
  );
};

export type AreaChartProps = {
  className?: string;
  formatDate?: (date: Date) => string;
  humanize?: Humanize;
  height?: number;
  loading?: boolean;
  query?: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  tickCount?: number;
  title?: string;
  data?: DataPoint[][];
  xAxis?: boolean;
  yAxis?: boolean;
  padding?: object;
  chartStyle?: object[];
  byteDataType?: ByteDataTypes; //Use this to process the whole data frame at once
  showAllTooltip?: boolean;
};

type AreaProps = AreaChartProps & {
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
  byteDataType?: ByteDataTypes;
  limitQuery?: string;
  requestedQuery?: string;
};
