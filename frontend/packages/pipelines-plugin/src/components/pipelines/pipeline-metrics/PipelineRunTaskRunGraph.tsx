import * as React from 'react';
import { formatPrometheusDuration } from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  getInteractiveLegendEvents,
  getInteractiveLegendItemStyles,
  ChartLegendTooltip,
  ChartLegend,
} from '@patternfly/react-charts';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import Measure from 'react-measure';
import { CursorVoronoiContainer } from '@console/internal/components/graphs';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingInline, truncateMiddle } from '@console/internal/components/utils';
import { PipelineTask } from '../../../types';
import { DEFAULT_CHART_HEIGHT, DEFAULT_LEGEND_CHART_HEIGHT } from '../const';
import { usePipelineRunTaskRunPoll } from '../hooks';
import { LineChart } from './charts/lineChart';
import {
  PipelineMetricsGraphProps,
  getRangeVectorData,
  getDuration,
} from './pipeline-metrics-utils';

import './pipeline-chart.scss';

const LegendContainer = ({ children }: { children?: React.ReactNode }) => {
  // The first child should be a <rect> with a `width` and `height` prop giving the legend's content width and height
  const width = children?.[0]?.[0]?.props?.width ?? '100%';
  const height = children?.[0]?.[0]?.props?.height ?? '100%';
  return (
    <foreignObject height={48} width="100%" y={DEFAULT_CHART_HEIGHT + 55}>
      <div className="pipeline-metrics__legend-wrap horizontal-scroll">
        <svg width={width} height={height}>
          {children}
        </svg>
      </div>
    </foreignObject>
  );
};

const PipelineRunTaskRunGraph: React.FC<PipelineMetricsGraphProps> = ({
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
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<number>>(new Set());
  const chartHeight = DEFAULT_LEGEND_CHART_HEIGHT;
  const [runData, runDataError, runDataLoading] = usePipelineRunTaskRunPoll({
    name,
    namespace,
    timespan,
    delay: interval,
    queryPrefix,
    metricsLevel,
  });

  const taskNameMap = pipeline.spec.tasks
    .filter((pipelineTask: PipelineTask) => !!pipelineTask.taskRef)
    .reduce((acc, task) => {
      acc[task.taskRef.name] = task.name;
      return acc;
    }, {});

  const getCustomTaskName = (task: string): string =>
    taskNameMap[task] ? taskNameMap[task] : task;

  const pipelineTaskRunData = React.useMemo(() => runData?.data?.result ?? [], [runData]);
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
            yTickFormatter={(seconds) => getDuration(seconds)}
            events={getEvents()}
            hiddenSeries={hiddenSeries}
            tickValues={tickValues}
            width={contentRect.bounds.width}
            height={chartHeight}
            legendComponent={
              !_.isEmpty(getLegendData()) && (
                <ChartLegend
                  groupComponent={<LegendContainer />}
                  gutter={18}
                  name="legend"
                  data={getLegendData()}
                  style={{
                    labels: { fontSize: 11, fill: 'var(--pf-global--Color--100)' },
                  }}
                />
              )
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
