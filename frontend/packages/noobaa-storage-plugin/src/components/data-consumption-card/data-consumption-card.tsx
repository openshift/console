import * as React from 'react';
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
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { BY_IOPS, CHART_LABELS, PROVIDERS, BY_EGRESS } from '../../constants';
import {
  DataConsumersValue,
  DataConsumersSortByValue,
  getDataConsumptionChartData,
  getQueries,
  numberInWords,
} from './data-consumption-card-utils';
import { DataConsumptionDropdown } from './data-consumption-card-dropdown';
import './data-consumption-card.scss';

const DataConsumptionCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [metricType, setMetricType] = React.useState(PROVIDERS);
  const [sortByKpi, setsortByKpi] = React.useState(BY_IOPS);

  React.useEffect(() => {
    const { queries, keys } = getQueries(metricType, sortByKpi);
    keys.forEach((key) => watchPrometheus(queries[key]));
    return () => keys.forEach((key) => stopWatchPrometheusQuery(queries[key]));
  }, [watchPrometheus, stopWatchPrometheusQuery, metricType, sortByKpi]);

  const { queries, keys } = getQueries(metricType, sortByKpi);
  const result: { [key: string]: PrometheusResponse } = {};
  const error = keys.some((key) => prometheusResults.getIn([queries[key], 'loadError']));
  keys.forEach((key) => {
    result[key] = prometheusResults.getIn([queries[key], 'data']); // building an object having 'key'from the queries object and 'value' as the Prometheus response
  });

  let padding: number;
  let suffixLabel = '';
  let maxVal: number;
  let maxUnit: string;

  const isLoading = _.values(result).includes(undefined);

  const metric = metricType === PROVIDERS ? 'type' : 'account';
  const curentDropdown = DataConsumersValue[metricType] + DataConsumersSortByValue[sortByKpi];
  const { chartData, legendData, max } = getDataConsumptionChartData(
    result,
    metric,
    curentDropdown,
  );

  // chartData = [[],[],[],[],[],[]] or []
  if (!chartData.some(_.isEmpty)) {
    padding =
      chartData[0].length === 2 || (sortByKpi === BY_EGRESS && chartData.length === 2) ? 125 : 25; // Adjusts spacing between each BarGroup
    maxVal = max.value;
    maxUnit = max.unit;
    suffixLabel = maxUnit;
    if (sortByKpi === BY_IOPS) {
      suffixLabel = numberInWords[maxUnit];
    }
    // if suffixLabel is a non-empty string, show it in expected form
    if (suffixLabel) suffixLabel = `(in ${suffixLabel})`;
  }

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Data Consumption</DashboardCardTitle>
        <DataConsumptionDropdown
          type={metricType}
          setType={setMetricType}
          kpi={sortByKpi}
          setKpi={setsortByKpi}
        />
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--top-margin" isLoading={isLoading}>
        {!error && !chartData.some(_.isEmpty) ? (
          <>
            <div className="nb-data-consumption-card__chart-label text-secondary">
              {CHART_LABELS[sortByKpi]} {suffixLabel}
            </div>
            <Chart
              containerComponent={
                <ChartVoronoiContainer
                  labelComponent={<ChartTooltip style={{ fontSize: 8, paddingBottom: 0 }} />}
                  labels={({ datum }) => `${datum.y} ${maxUnit}`}
                  voronoiDimension="x"
                />
              }
              minDomain={{ y: 0 }}
              maxDomain={{ y: maxVal + 10 }}
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
              <ChartGroup offset={sortByKpi === BY_EGRESS ? 0 : 11}>
                {chartData.map((data, i) => (
                  <ChartBar key={i} data={data} /> // eslint-disable-line react/no-array-index-key
                ))}
              </ChartGroup>
            </Chart>
          </>
        ) : (
          <GraphEmpty />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DataConsumptionCard);
