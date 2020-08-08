import * as React from 'react';
import * as classNames from 'classnames';
import {
  humanizeDecimalBytesPerSec,
  useRefWidth,
  humanizeSeconds,
} from '@console/internal/components/utils';
import {
  Chart,
  ChartVoronoiContainer,
  ChartTooltip,
  ChartThemeColor,
  ChartAxis,
  ChartGroup,
  ChartLine,
  ChartLegend,
} from '@patternfly/react-charts';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { PrometheusGraph } from '@console/internal/components/graphs/prometheus-graph';
import { getLatestValue } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/utilization-card/utils';
import { DataPoint } from '@console/internal/components/graphs';
import { Metrics, CHART_LABELS } from '../../constants';
import './data-consumption-card.scss';

type PerformanceGraphProps = {
  dataPoints: DataPoint[][][];
  loading: boolean;
  loadError: boolean;
  metricType: string;
};

const PerformanceGraph: React.FC<PerformanceGraphProps> = ({
  dataPoints,
  loading,
  loadError,
  metricType,
}) => {
  const [getDataArray, putDataArray] = dataPoints;
  const [containerRef, width] = useRefWidth();
  const humanize = metricType === Metrics.BANDWIDTH ? humanizeDecimalBytesPerSec : humanizeSeconds;
  const getData = getDataArray?.[0];
  const putData = putDataArray?.[0];
  const PUTLatestValue = humanize(getLatestValue(putData)).string;
  const GETLatestValue = humanize(getLatestValue(getData)).string;

  const legends = [{ name: `PUT ${PUTLatestValue}` }, { name: `GET ${GETLatestValue}` }];

  if (loadError) {
    return <GraphEmpty />;
  }
  if (!loading && !loadError) {
    return (
      <>
        <div className="nb-data-consumption-card__chart-label text-secondary">
          {CHART_LABELS[metricType]}
        </div>
        <PrometheusGraph
          ref={containerRef}
          className={classNames({
            'nb-perf__graph--short': metricType === Metrics.LATENCY,
            'nb-perf__graph--long': metricType === Metrics.BANDWIDTH,
          })}
        >
          <Chart
            ariaTitle="RGW Performance Graph"
            domainPadding={{ y: 20 }}
            containerComponent={
              <ChartVoronoiContainer
                voronoiDimension="x"
                labelComponent={<ChartTooltip style={{ fontSize: 14, padding: 5 }} />}
                labels={({ datum }) =>
                  `${humanize(datum.y).string} at ${twentyFourHourTime(datum.x)}`
                }
              />
            }
            themeColor={ChartThemeColor.multi}
            scale={{ x: 'time', y: 'linear' }}
            height={493}
            width={width}
            padding={{ top: 15, bottom: 30, left: 40, right: 30 }}
            legendPosition="bottom-left"
            legendComponent={
              <ChartLegend
                data={legends}
                themeColor={ChartThemeColor.multi}
                orientation="horizontal"
                rowGutter={{ top: 0, bottom: 1 }}
                itemsPerRow={2}
                style={{
                  labels: { fontSize: 15 },
                }}
                padding={{
                  bottom: 50,
                  left: 30,
                  right: 20,
                  top: 30,
                }}
              />
            }
          >
            <ChartAxis offsetX={0} tickFormat={(x) => twentyFourHourTime(x)} />
            <ChartAxis dependentAxis tickFormat={(x) => humanize(x).string} />
            <ChartGroup>
              <ChartLine data={getData} />
              <ChartLine data={putData} />
            </ChartGroup>
          </Chart>
        </PrometheusGraph>
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

export default PerformanceGraph;
