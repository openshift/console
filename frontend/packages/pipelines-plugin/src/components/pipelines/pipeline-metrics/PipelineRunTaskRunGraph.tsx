import * as React from 'react';
import {
  ChartLegend,
  getInteractiveLegendEvents,
  getInteractiveLegendItemStyles,
  ChartLegendTooltip,
} from '@patternfly/react-charts';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import Measure from 'react-measure';
import { CursorVoronoiContainer } from '@console/internal/components/graphs';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingInline, truncateMiddle } from '@console/internal/components/utils';
import { formatPrometheusDuration } from '@console/internal/components/utils/datetime';
import { PipelineTask } from '../../../types';
import { DEFAULT_CHART_HEIGHT, DEFAULT_LEGEND_CHART_HEIGHT } from '../const';
import { usePipelineRunTaskRunPoll } from '../hooks';
import { LineChart } from './charts/lineChart';
import {
  PipelineMetricsGraphProps,
  getRangeVectorData,
  getYaxisValues,
} from './pipeline-metrics-utils';

import './pipeline-chart.scss';

const PipelineRunTaskRunGraph: React.FC<PipelineMetricsGraphProps> = ({
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
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<number>>(new Set());
  const chartHeight = DEFAULT_LEGEND_CHART_HEIGHT;
  const [runData, runDataError, runDataLoading] = usePipelineRunTaskRunPoll({
    name,
    namespace,
    timespan,
    delay: interval,
    queryPrefix,
  });

  const taskNameMap = pipeline.spec.tasks
    .filter((pipelineTask: PipelineTask) => !!pipelineTask.taskRef)
    .reduce((acc, task) => {
      acc[task.taskRef.name] = task.name;
      return acc;
    }, {});

  const getCustomTaskName = (task: string): string =>
    taskNameMap[task] ? taskNameMap[task] : task;

  const pipelineTaskRunData = runData?.data?.result ?? [];
  React.useEffect(() => {
    if (!loaded && onInitialLoad) {
      onInitialLoad({
        chartName: 'pipelineTaskRunDuration',
        hasData: !!pipelineTaskRunData.length,
      });
    }
  }, [loaded, onInitialLoad, pipelineTaskRunData]);

  if (runDataLoading) {
    return <LoadingInline />;
  }

  if ((!loaded && pipelineTaskRunData.length) || runDataError || pipelineTaskRunData.length === 0) {
    return <GraphEmpty height={chartHeight - 30} />;
  }

  const pRuns =
    getRangeVectorData(runData, (r) => truncateMiddle(r.metric.pipelinerun, { length: 10 })) ?? [];
  const tickValues = [];
  const finalObj: { [x: string]: { x: string; y: number }[] } = pRuns.reduce((acc, prun) => {
    if (!prun) return acc;
    const obj = prun[prun.length - 1];
    const taskName = getCustomTaskName(obj?.metric?.task);
    if (taskName) {
      if (!acc[taskName]) {
        acc[taskName] = [];
      }
      tickValues.push(truncateMiddle(obj.metric.pipelinerun, { length: 10 }));
      acc[taskName].push(obj);
    }
    return acc;
  }, {});

  const getLegendData = () => {
    return _.map(Object.keys(finalObj), (task, index) => ({
      childName: `line-${index}`,
      name: task,
      ...getInteractiveLegendItemStyles(hiddenSeries.has(index)),
    }));
  };
  const getChartNames = (): string[][] => {
    return getLegendData().map((l, i) => [l.childName, `scatter-${i}`]);
  };
  const isHidden = (index) => {
    return hiddenSeries.has(index);
  };
  const handleLegendClick = (props) => {
    const hidden = new Set(hiddenSeries);
    if (!hidden.delete(props.index)) {
      hidden.add(props.index);
    }
    setHiddenSeries(hidden);
  };
  const getEvents = () =>
    getInteractiveLegendEvents({
      chartNames: getChartNames() as [string | string[]],
      isHidden,
      legendName: 'legend',
      onLegendClick: handleLegendClick,
    });
  return (
    <Measure bounds>
      {({ measureRef, contentRect }) => (
        <div ref={measureRef}>
          <LineChart
            ariaDesc={t('pipelines-plugin~Pipeline task run duration chart')}
            data={_.values(finalObj)}
            yTickFormatter={(seconds) => getYaxisValues(seconds)}
            events={getEvents()}
            hiddenSeries={hiddenSeries}
            tickValues={tickValues}
            width={contentRect.bounds.width}
            height={chartHeight}
            legendPosition="bottom-left"
            legendComponent={
              <ChartLegend
                gutter={25}
                y={DEFAULT_CHART_HEIGHT + 75}
                itemsPerRow={4}
                name="legend"
                data={getLegendData()}
              />
            }
            containerComponent={
              <CursorVoronoiContainer
                constrainToVisibleArea
                mouseFollowTooltips
                voronoiDimension="x"
                cursorDimension="x"
                labels={({ datum }) =>
                  `${datum.y !== null ? formatPrometheusDuration(datum?.y * 1000) : null}`
                }
                labelComponent={
                  <ChartLegendTooltip
                    legendData={getLegendData()}
                    title={(datum) => truncateMiddle(datum?.metric?.pipelinerun)}
                  />
                }
                activateData={false}
                voronoiPadding={{ bottom: 75 } as any}
              />
            }
          />
        </div>
      )}
    </Measure>
  );
};

export default PipelineRunTaskRunGraph;
