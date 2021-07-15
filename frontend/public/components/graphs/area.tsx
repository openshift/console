import * as React from 'react';
import * as _ from 'lodash';
import i18n from 'i18next';
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartThemeColor,
  ChartThemeVariant,
  ChartVoronoiContainer,
  getCustomTheme,
  ChartGroup,
  ChartAreaProps,
} from '@patternfly/react-charts';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { processFrame, ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { timeFormatter } from '../utils/datetime';
import { humanizeNumber, useRefWidth, Humanize } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { areaTheme } from './themes';
import {
  DataPoint,
  CursorVoronoiContainer,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from './';
import { mapLimitsRequests } from './utils';
import { GraphEmpty } from './graph-empty';
import { ChartLegendTooltip } from './tooltip';

const DEFAULT_HEIGHT = 180;
const DEFAULT_TICK_COUNT = 2;

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
  showAllTooltip,
  mainDataName,
  ...rest
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

  const xTickFormat = React.useCallback((tick) => formatDate(tick), [formatDate]);
  const yTickFormat = React.useCallback((tick) => `${humanize(tick, unit, unit).string}`, [
    humanize,
    unit,
  ]);

  const domain = React.useMemo<AreaChartProps['domain']>(
    () => ({
      ...(allZero && { y: [0, 1] }),
      ...(rest.domain ?? {}),
    }),
    [allZero, rest.domain],
  );

  const getLabel = React.useCallback(
    (prop: { datum: DataPoint<Date> }, includeDate = true) => {
      const { x, y } = prop.datum;
      const value = humanize(y, unit, unit).string;
      const date = formatDate(x);
      return includeDate ? i18n.t('public~{{value}} at {{date}}', { value, date }) : value;
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
          mouseFollowTooltips
          labelComponent={
            <ChartLegendTooltip
              stack={showAllTooltip}
              legendData={legendData}
              getLabel={getLabel}
              formatDate={(d) => formatDate(d[0].x)}
              mainDataName={mainDataName}
            />
          }
          voronoiDimension="x"
        />
      );
    }
    return <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} activateData={false} />;
  }, [formatDate, getLabel, mainDataName, multiLine, processedData, showAllTooltip]);

  return (
    <PrometheusGraph className={className} ref={containerRef} title={title}>
      <PrometheusGraphLink query={query} ariaChartLinkLabel={ariaChartLinkLabel}>
        {processedData?.length ? (
          <Chart
            ariaTitle={ariaChartTitle || title}
            containerComponent={container}
            domainPadding={{ y: 20 }}
            height={height}
            width={width}
            theme={theme}
            scale={{ x: 'time', y: 'linear' }}
            padding={padding}
            domain={domain}
          >
            {xAxis && <ChartAxis tickCount={tickCount} tickFormat={xTickFormat} />}
            {yAxis && <ChartAxis dependentAxis tickCount={tickCount} tickFormat={yTickFormat} />}
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
        ) : (
          <GraphEmpty height={height} loading={loading} />
        )}
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

export const Area: React.FC<AreaProps> = ({
  endTime = Date.now(),
  namespace,
  query,
  limitQuery,
  requestedQuery,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
  ...rest
}) => {
  const prometheusPollProps = {
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    endTime,
    namespace,
    samples,
    timeout,
    timespan,
  };

  const [utilization, , utilizationLoading] = usePrometheusPoll({
    query,
    ...prometheusPollProps,
  });
  const [limit, , limitLoading] = usePrometheusPoll({
    query: limitQuery,
    ...prometheusPollProps,
  });
  const [requested, , requestedLoading] = usePrometheusPoll({
    query: requestedQuery,
    ...prometheusPollProps,
  });

  const loading = utilizationLoading && limitLoading && requestedLoading;
  const { data, chartStyle } = mapLimitsRequests(utilization, limit, requested);

  return (
    <AreaChart
      chartStyle={chartStyle}
      data={data}
      loading={loading}
      query={[query, limitQuery, requestedQuery]}
      mainDataName="usage"
      {...rest}
    />
  );
};

export type AreaChartProps = {
  className?: string;
  domain?: ChartAreaProps['domain'];
  formatDate?: (date: Date, showSeconds?: boolean) => string;
  humanize?: Humanize;
  height?: number;
  loading?: boolean;
  query?: string | string[];
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  tickCount?: number;
  title?: string;
  ariaChartLinkLabel?: string;
  ariaChartTitle?: string;
  data?: DataPoint[][];
  xAxis?: boolean;
  yAxis?: boolean;
  padding?: object;
  chartStyle?: object[];
  byteDataType?: ByteDataTypes; //Use this to process the whole data frame at once
  showAllTooltip?: boolean;
  mainDataName?: string;
};

type AreaProps = AreaChartProps & {
  endTime?: number;
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
  byteDataType?: ByteDataTypes;
  limitQuery?: string;
  requestedQuery?: string;
};
