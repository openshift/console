import * as React from 'react';
import { ChartVoronoiContainer } from '@patternfly/react-charts/victory';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DataPoint } from '@console/internal/components/graphs';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingInline } from '@console/internal/components/utils';
import MeasureBounds from '@console/pipelines-plugin/src/utils/measure';
import { DEFAULT_CHART_HEIGHT, DEFAULT_SAMPLES } from '../const';
import { usePipelineRunPoll } from '../hooks';
import { TimeSeriesChart } from './charts/TimeSeriesChart';
import {
  formatDate,
  formatTimeSeriesValues,
  getTransformedDataPoints,
  PipelineMetricsGraphProps,
} from './pipeline-metrics-utils';

import './pipeline-chart.scss';

const PipelineRunCount: React.FC<PipelineMetricsGraphProps> = ({
  pipeline,
  timespan,
  interval,
  loaded = true,
  onLoad: onInitialLoad,
  queryPrefix,
  metricsLevel,
}) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const { t } = useTranslation();
  const [pipelineRunResult, error, loading] = usePipelineRunPoll({
    name,
    namespace,
    timespan,
    delay: interval,
    queryPrefix,
    metricsLevel,
  });
  const pipelineRunResultData = React.useMemo(() => pipelineRunResult?.data?.result ?? [], [
    pipelineRunResult,
  ]);

  React.useEffect(() => {
    if (!loaded && onInitialLoad) {
      onInitialLoad({ chartName: 'pipelineRunCount', hasData: !!pipelineRunResultData.length });
    }
  }, [loaded, onInitialLoad, pipelineRunResultData]);

  if (loading) {
    return <LoadingInline />;
  }
  if ((!loaded && pipelineRunResultData.length) || error || pipelineRunResultData.length === 0) {
    return <GraphEmpty height={DEFAULT_CHART_HEIGHT} />;
  }

  const newGraphData = _.map(pipelineRunResultData, (result) => {
    return formatTimeSeriesValues(result, DEFAULT_SAMPLES, timespan);
  });
  const grouped = _.groupBy(newGraphData[0], (g) => formatDate(g.x));
  const finalArray: DataPoint[] = getTransformedDataPoints(
    _.compact(_.keys(grouped).map((x) => _.maxBy(grouped[x], 'y'))),
  );

  return (
    <MeasureBounds>
      {({ measureRef, contentRect }) => (
        <div ref={measureRef} style={{ height: DEFAULT_CHART_HEIGHT }}>
          <TimeSeriesChart
            ariaDesc={t('pipelines-plugin~Pipeline run count chart')}
            data={finalArray}
            timespan={timespan}
            width={contentRect.bounds.width}
            containerComponent={
              <ChartVoronoiContainer
                constrainToVisibleArea
                labels={({ datum }) =>
                  datum.childName.includes('bar-') && datum.y !== null
                    ? `${formatDate(datum.x)}
                    ${t('pipelines-plugin~Pipeline Runs')}: ${datum.y}`
                    : null
                }
              />
            }
          />
        </div>
      )}
    </MeasureBounds>
  );
};

export default PipelineRunCount;
