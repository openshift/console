import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChartThemeColor, ChartVoronoiContainer } from '@patternfly/react-charts';
import { Bullseye, Flex, FlexItem, Grid, GridItem } from '@patternfly/react-core';
import { LoadingInline, truncateMiddle } from '@console/internal/components/utils';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { formatDuration } from '@console/internal/components/utils/datetime';
import { usePipelineRunDurationPoll } from '../hooks';
import { DEFAULT_LEGEND_CHART_HEIGHT } from '../const';
import { getRangeVectorData, PipelineMetricsGraphProps } from './pipeline-metrics-utils';
import { LineChart } from './charts/lineChart';

import './pipeline-chart.scss';

const PipelineRunDurationGraph: React.FC<PipelineMetricsGraphProps> = ({
  pipeline,
  timespan,
  interval,
  width = 1000,
  loaded = true,
  onLoad: onInitialLoad,
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
  });
  const pipelineRunDurationData = runData?.data?.result ?? [];

  const chartHeight = DEFAULT_LEGEND_CHART_HEIGHT;
  if (runDataLoading) {
    return <LoadingInline />;
  }

  if (!loaded) {
    onInitialLoad &&
      onInitialLoad({
        chartName: 'pipelineRunDuration',
        hasData: !!pipelineRunDurationData.length,
      });
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
      acc.duration.push({ ...obj, time: formatDuration(obj.y * 1000) });
      return acc;
    },
    { totalDuration: 0, duration: [] },
  );
  const averageDuration = finalArray.totalDuration
    ? formatDuration((finalArray.totalDuration * 1000) / finalArray.duration.length)
    : 0;

  return (
    <Grid hasGutter>
      <GridItem span={3}>
        <Bullseye className="pipeline-run-average">
          <Flex className="pipeline-run-average__body" spaceItems={{ default: 'spaceItemsNone' }}>
            <FlexItem className="pipeline-run-average__duration">{`${averageDuration}`}</FlexItem>
            <FlexItem className="pipeline-run-average__duration-desc">
              {t('pipelines-plugin~Average Pipeline Run duration')}
            </FlexItem>
          </Flex>
        </Bullseye>
      </GridItem>
      <GridItem span={9}>
        <LineChart
          ariaDesc={t('pipelines-plugin~Pipeline run duration chart')}
          ariaTitle={t('pipelines-plugin~Pipeline run duration')}
          data={[finalArray.duration]}
          themeColor={ChartThemeColor.green}
          yTickFormatter={(seconds) => `${Math.floor(seconds / 60)}m`}
          width={(width * 70) / 100}
          height={chartHeight}
          containerComponent={
            <ChartVoronoiContainer
              voronoiPadding={{ bottom: 75 } as any}
              constrainToVisibleArea
              activateData={false}
              labels={({ datum }) =>
                datum.childName.includes('line-') && datum.y !== null
                  ? `${datum?.metric?.pipelinerun} 
              ${datum?.time}`
                  : null
              }
            />
          }
        />
      </GridItem>
    </Grid>
  );
};

export default PipelineRunDurationGraph;
