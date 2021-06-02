import * as React from 'react';
import { ChartVoronoiContainer } from '@patternfly/react-charts';
import { Grid, GridItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import Measure from 'react-measure';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingInline } from '@console/internal/components/utils';
import { DEFAULT_CHART_HEIGHT } from '../const';
import { usePipelineSuccessRatioPoll } from '../hooks';
import SuccessRatioDonut from './charts/successRatioDonut';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import {
  PipelineMetricsGraphProps,
  getRangeVectorData,
  formatDate,
} from './pipeline-metrics-utils';

import './pipeline-chart.scss';

const PipelineSuccessRatioDonut: React.FC<PipelineMetricsGraphProps> = ({
  pipeline,
  timespan,
  interval,
  loaded = true,
  onLoad: onInitialLoad,
  queryPrefix,
}) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const { t } = useTranslation();
  const [runData, runDataError, runDataLoading] = usePipelineSuccessRatioPoll({
    name,
    namespace,
    timespan,
    delay: interval,
    queryPrefix,
  });
  const pipelineSuccessData = runData?.data?.result ?? [];

  React.useEffect(() => {
    if (!loaded && onInitialLoad) {
      onInitialLoad({
        chartName: 'pipelineSuccessRatio',
        hasData: !!pipelineSuccessData.length,
      });
    }
  }, [loaded, onInitialLoad, pipelineSuccessData]);

  if (runDataLoading) {
    return <LoadingInline />;
  }

  if ((!loaded && pipelineSuccessData.length) || runDataError || pipelineSuccessData.length === 0) {
    return <GraphEmpty height={DEFAULT_CHART_HEIGHT} />;
  }

  const pipelineRuns = getRangeVectorData(runData, (r) => r.metric.status) ?? [];
  const pipelineRunsCollection = pipelineRuns.reduce((acc, prun) => {
    if (!prun) return acc;
    const obj = prun[prun.length - 1];
    acc.push(obj);
    return acc;
  }, []);

  const totalValue = _.sumBy(pipelineRunsCollection, 'y');
  const finalArray = pipelineRunsCollection.map((obj) => {
    const percentage = ((obj.y * 100) / totalValue).toFixed(2);
    const sortOrder = obj.x === 'success' ? 1 : 2;
    return {
      ...obj,
      count: obj.y,
      sortOrder,
      y: parseFloat(percentage),
      name: `${obj.x}: ${percentage}%`,
    };
  });
  let successTimeSeriesObj = finalArray.reduce((acc, obj) => {
    if (obj.x !== 'success') return acc;
    const date = formatDate(new Date(obj.time * 1000));
    if (!acc[date]) {
      acc[date] = { y: 0 };
    }
    acc[date] = {
      ...obj,
      x: new Date(obj.time * 1000).setHours(0, 0, 0, 0),
      y: acc[date].y + obj.y,
    };
    return acc;
  }, {});
  // Empty state for line chart
  if (!Object.keys(successTimeSeriesObj).length) {
    successTimeSeriesObj = {
      emptyState: {
        ...finalArray[0],
        x: new Date().setHours(0, 0, 0, 0),
        y: 0,
      },
    };
  }
  const successValue = _.find(finalArray, { x: 'success' })?.['count'] ?? 0;
  const successData = _.sortBy(finalArray, 'sortOrder');
  const OVERLAP = 20;
  return (
    <Grid hasGutter>
      <GridItem xl2={3} xl={3} lg={3} md={3} sm={3}>
        <div
          style={{
            height: DEFAULT_CHART_HEIGHT,
            marginTop: OVERLAP * -1,
          }}
        >
          <SuccessRatioDonut
            data={successData}
            successValue={successValue}
            ariaDesc={t('pipelines-plugin~Pipeline success ratio chart')}
            subTitle={
              successData
                ? t('pipelines-plugin~{{successValue}} of {{totalValue}} succeeded', {
                    successValue,
                    totalValue,
                  })
                : ''
            }
            title={successData.length ? `${((successValue * 100) / totalValue).toFixed(1)}%` : ''}
          />
        </div>
      </GridItem>
      <GridItem xl2={9} xl={9} lg={9} md={9} sm={9}>
        <Measure bounds>
          {({ measureRef, contentRect }) => (
            <div ref={measureRef} style={{ height: DEFAULT_CHART_HEIGHT }}>
              <TimeSeriesChart
                ariaDesc={t('pipelines-plugin~Pipeline success chart')}
                data={Object.values(successTimeSeriesObj) ?? []}
                bar={false}
                domain={{ y: [0, 100] }}
                yTickFormatter={(v) => `${v}%`}
                timespan={timespan}
                width={contentRect.bounds.width}
                containerComponent={
                  <ChartVoronoiContainer
                    constrainToVisibleArea
                    labels={({ datum }) =>
                      datum.childName.includes('line-') && datum.y !== null
                        ? `${formatDate(datum.x)}\n${datum?.y}%`
                        : null
                    }
                  />
                }
              />
            </div>
          )}
        </Measure>
      </GridItem>
    </Grid>
  );
};

export default PipelineSuccessRatioDonut;
