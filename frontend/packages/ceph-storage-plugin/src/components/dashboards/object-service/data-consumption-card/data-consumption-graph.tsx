import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLegend,
  ChartThemeColor,
  ChartTooltip,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getDataConsumptionChartData, numberInWords } from './data-consumption-card-utils';
import { CHART_LABELS, Breakdown, Metrics, ServiceType } from '../../../../constants';
import { DATA_CONSUMPTION_QUERIES } from '../../../../queries/object-storage-queries';
import './data-consumption-card.scss';

type DataConsumptionGraphProps = {
  prometheusResponse: PrometheusResponse[];
  breakdownBy: string;
  metric: Metrics;
  loading: boolean;
  loadError: boolean;
};

const DataConsumptionGraph: React.FC<DataConsumptionGraphProps> = ({
  prometheusResponse: prometheusResults,
  breakdownBy,
  metric,
  loading,
  loadError,
}) => {
  const { t } = useTranslation();

  let padding: number;
  let suffixLabel = '';
  let maxVal: number;
  let maxUnit: string;

  const resultsWithKeys = (() => {
    const queryMap =
      DATA_CONSUMPTION_QUERIES[ServiceType.MCG][breakdownBy][metric] ??
      DATA_CONSUMPTION_QUERIES[ServiceType.MCG][breakdownBy][Metrics.IOPS];
    return Object.keys(queryMap).reduce((acc, curr, ind) => {
      acc[curr] = prometheusResults[ind];
      return acc;
    }, {});
  })();

  const mcgBreakdown = breakdownBy === Breakdown.PROVIDERS ? 'type' : 'account';
  const { chartData, legendData, max } = getDataConsumptionChartData(
    resultsWithKeys,
    mcgBreakdown,
    metric,
    t,
  );

  const emptyData = chartData.some(_.isEmpty);

  // chartData = [[],[],[],[],[],[]] or []
  if (!loading && !loadError) {
    padding =
      chartData[0].length === 2 || (metric === Metrics.EGRESS && chartData.length === 2) ? 125 : 25; // Adjusts spacing between each BarGroup
    maxVal = max.value;
    maxUnit = max.unit;
    suffixLabel = maxUnit;
    if (metric === Metrics.IOPS) {
      suffixLabel = numberInWords(maxUnit, t);
    }
    // if suffixLabel is a non-empty string, show it in expected form
    if (suffixLabel) suffixLabel = t('ceph-storage-plugin~(in {{suffixLabel}})', { suffixLabel });
  }

  if (loadError || emptyData) {
    return <GraphEmpty />;
  }
  if (!loading && !loadError) {
    return (
      <>
        <div className="nb-data-consumption-card__chart-label text-secondary">
          {`${CHART_LABELS(metric, t)} ${suffixLabel}`}
        </div>
        <Chart
          ariaTitle={t('ceph-storage-plugin~Data Consumption Graph')}
          containerComponent={
            <ChartVoronoiContainer
              labelComponent={<ChartTooltip style={{ fontSize: 8, paddingBottom: 0 }} />}
              labels={({ datum }) => `${datum.name} ${datum.y} ${maxUnit}`}
            />
          }
          minDomain={{ y: 0 }}
          maxDomain={{ y: maxVal + Math.round(maxVal * 0.25) }}
          domainPadding={{ x: [padding, padding] }}
          legendComponent={
            <ChartLegend
              themeColor={ChartThemeColor.purple}
              data={legendData}
              orientation="horizontal"
              symbolSpacer={5}
              gutter={2}
              height={30}
              padding={{ top: 50, bottom: 0 }}
              style={{ labels: { fontSize: 8 } }}
            />
          }
          legendPosition="bottom-left"
          padding={{
            bottom: 50,
            left: 30,
            right: 20,
            top: 30,
          }}
          themeColor={ChartThemeColor.purple}
        >
          <ChartAxis style={{ tickLabels: { fontSize: 8, padding: 2 } }} />
          <ChartAxis
            dependentAxis
            showGrid
            tickCount={10}
            style={{
              tickLabels: { fontSize: 8, padding: 0 },
            }}
          />
          <ChartGroup offset={metric === Metrics.EGRESS ? 0 : 11}>
            {chartData.map((data, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <ChartBar key={`chartbar-${i}`} data={data} />
            ))}
          </ChartGroup>
        </Chart>
      </>
    );
  }
  return (
    <>
      <div className="skeleton-text nb-data-consumption-card__chart-skeleton" />
      <GraphEmpty height={200} loading />
      <div className="skeleton-text nb-data-consumption-card__chart-legend-skeleton" />
    </>
  );
};

export default DataConsumptionGraph;
