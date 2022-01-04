import * as React from 'react';
import i18n from 'i18next';
import { ChartLegendTooltip } from '@console/internal/components/graphs/tooltip';
import {
  ChartVoronoiContainer,
  ChartGroup,
  ChartArea,
  ChartStack,
  ChartLine,
  ChartThemeColor,
  Chart,
  ChartAxis,
} from '@patternfly/react-charts';
import { DataPoint, CursorVoronoiContainer } from '@console/internal/components/graphs';
import { humanizeNumber, Humanize, useRefWidth } from '@console/internal/components/utils';
import { processFrame, ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { timeFormatter } from '@console/internal/components/utils/datetime';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import {
  PrometheusGraph,
  PrometheusGraphLink,
} from '@console/internal/components/graphs/prometheus-graph';

export const AreaChart: React.FC<AreaChartProps> = ({
  data = [],
  formatDate = timeFormatter.format,
  humanize = humanizeNumber,
  loading = true,
  query,
  ariaChartLinkLabel,
  ariaChartTitle,
  xAxis = true,
  yAxis = true,
  chartStyle,
  byteDataType = '',
  mainDataName,
  chartType,
  tickCount = 4,
  height = 200,
}) => {
  const [containerRef, width] = useRefWidth();

  const { processedData, unit } = React.useMemo(() => {
    const nonEmptyDataSets = data.filter((dataSet) => dataSet?.length);
    if (byteDataType) {
      return processFrame(nonEmptyDataSets, byteDataType);
    }
    return { processedData: nonEmptyDataSets, unit: '' };
  }, [byteDataType, data]);

  const xTickFormat = React.useCallback((tick) => formatDate(tick), [formatDate]);
  const yTickFormat = React.useCallback((tick) => `${humanize(tick, unit, unit).string}`, [
    humanize,
    unit,
  ]);

  const getLabel = React.useCallback(
    (prop: { datum: DataPoint<Date> }, includeDate = true) => {
      const { x, y } = prop.datum;
      const value = humanize(y, unit, unit).string;
      const date = formatDate(x);
      return includeDate ? i18n.t('public~{{value}} at {{date}}', { value, date }) : value;
    },
    [humanize, unit, formatDate],
  );

  const legendData = processedData.map((d) => ({
    childName: d[0].description,
    name: d[0].description,
    symbol: d[0].symbol,
  }));

  const container = React.useMemo(() => {
    if (processedData?.length > 1) {
      return (
        <CursorVoronoiContainer
          activateData={false}
          cursorDimension="x"
          labels={(props) => getLabel(props, false)}
          mouseFollowTooltips
          labelComponent={
            <ChartLegendTooltip
              stack
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
  }, [formatDate, getLabel, legendData, mainDataName, processedData]);

  let CustomChartGroup = ChartGroup;
  let CustomChartArea = ChartArea;

  if (chartType === 'stacked-area') {
    CustomChartGroup = ChartStack;
  }

  if (chartType === 'grouped-line') {
    CustomChartArea = ChartLine;
    CustomChartGroup = ChartGroup;
  }

  return (
    <PrometheusGraph ref={containerRef}>
      <PrometheusGraphLink query={query} ariaChartLinkLabel={ariaChartLinkLabel}>
        {processedData?.length ? (
          <Chart
            ariaTitle={ariaChartTitle}
            containerComponent={container}
            domainPadding={{ y: 20 }}
            height={height}
            width={width}
            themeColor={ChartThemeColor.multiUnordered}
            scale={{ x: 'time', y: 'linear' }}
            padding={{ top: 20, left: 70, bottom: 60, right: 0 }}
            legendData={chartType ? legendData : null}
            legendPosition="bottom-left"
          >
            {xAxis && <ChartAxis tickCount={tickCount} tickFormat={xTickFormat} />}
            {yAxis && <ChartAxis dependentAxis tickCount={tickCount} tickFormat={yTickFormat} />}
            <CustomChartGroup height={height} width={width}>
              {processedData.map((datum, index) => (
                <CustomChartArea
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  data={datum}
                  style={chartStyle && chartStyle[index]}
                  name={datum[0]?.description}
                />
              ))}
            </CustomChartGroup>
          </Chart>
        ) : (
          <GraphEmpty height={height} loading={loading} />
        )}
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

export type AreaChartProps = {
  formatDate?: (date: Date, showSeconds?: boolean) => string;
  humanize?: Humanize;
  loading?: boolean;
  query?: string | string[];
  ariaChartLinkLabel?: string;
  ariaChartTitle?: string;
  data?: DataPoint[][];
  xAxis?: boolean;
  yAxis?: boolean;
  chartStyle?: object[];
  byteDataType?: ByteDataTypes; // Use this to process the whole data frame at once
  mainDataName?: string;
  chartType?: 'stacked-area' | 'grouped-line';
  tickCount?: number;
  height?: number;
};
