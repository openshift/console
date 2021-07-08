import * as React from 'react';
import { ChartThemeColor, ChartVoronoiContainer } from '@patternfly/react-charts';
import { Bullseye, Flex, FlexItem, Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import Measure from 'react-measure';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingInline, truncateMiddle } from '@console/internal/components/utils';
import { formatPrometheusDuration } from '@console/internal/components/utils/datetime';
import { DEFAULT_LEGEND_CHART_HEIGHT } from '../const';
import { usePipelineRunDurationPoll } from '../hooks';
import { LineChart } from './charts/lineChart';
import { getRangeVectorData, PipelineMetricsGraphProps } from './pipeline-metrics-utils';

import './pipeline-chart.scss';

const PipelineRunDurationGraph: React.FC<PipelineMetricsGraphProps> = ({
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
  const [runData, runDataError, runDataLoading] = usePipelineRunDurationPoll({
    name,
    namespace,
    timespan,
    delay: interval,
    queryPrefix,
  });
  const pipelineRunDurationData = runData?.data?.result ?? [];

  const chartHeight = DEFAULT_LEGEND_CHART_HEIGHT;

  React.useEffect(() => {
    if (!loaded && onInitialLoad) {
      onInitialLoad({
        chartName: 'pipelineRunDuration',
        hasData: !!pipelineRunDurationData.length,
      });
    }
  }, [loaded, onInitialLoad, pipelineRunDurationData]);

  if (runDataLoading) {
    return <LoadingInline />;
  }
  if (
    (!loaded && pipelineRunDurationData.length) ||
    runDataError ||
    pipelineRunDurationData.length === 0
  ) {
    return <GraphEmpty height={chartHeight - 30} />;
  }

  const pRuns =
    getRangeVectorData(runData, (r) => truncateMiddle(r?.metric?.pipelinerun, { length: 10 })) ??
    [];
  const finalArray = pRuns.reduce(
    (acc, prun) => {
      if (!prun) return acc;
      const obj = prun[prun.length - 1];
      acc.totalDuration += obj.y;
      acc.duration.push({ ...obj, time: formatPrometheusDuration(obj.y * 1000) });
      return acc;
    },
    { totalDuration: 0, duration: [] },
  );
  const averageDuration = finalArray.totalDuration
    ? formatPrometheusDuration((finalArray.totalDuration * 1000) / finalArray.duration.length)
    : 0;

  return (
    <Grid hasGutter>
      <GridItem span={3}>
        <Bullseye className="pipeline-run-average">
          <Flex className="pipeline-run-average__body" spaceItems={{ default: 'spaceItemsNone' }}>
            <FlexItem className="pipeline-run-average__duration">{`${averageDuration}`}</FlexItem>
            <FlexItem className="pipeline-run-average__duration-desc">
              {t('pipelines-plugin~Average PipelineRun duration')}
            </FlexItem>
          </Flex>
        </Bullseye>
      </GridItem>
      <GridItem span={9}>
        <Measure bounds>
          {({ measureRef, contentRect }) => (
            <div ref={measureRef}>
              <LineChart
                ariaDesc={t('pipelines-plugin~Pipeline run duration chart')}
                data={[finalArray.duration]}
                themeColor={ChartThemeColor.green}
                yTickFormatter={(seconds) => `${Math.floor(seconds / 60)}m`}
                width={contentRect.bounds.width}
                height={chartHeight}
                containerComponent={
                  <ChartVoronoiContainer
                    voronoiPadding={{ bottom: 75 } as any}
                    constrainToVisibleArea
                    activateData={false}
                    labels={({ datum }) =>
                      datum.childName.includes('line-') && datum.y !== null
                        ? `${datum?.metric?.pipelinerun}\n${datum?.time}`
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

export default PipelineRunDurationGraph;
