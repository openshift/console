import * as React from 'react';
import { Flex, FlexItem, Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { parsePrometheusDuration } from '@console/internal/components/utils/datetime';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { PipelineDetailsTabProps } from '../detail-page-tabs/types';
import { useLatestPipelineRun } from '../hooks';
import { GraphData } from './pipeline-metrics-utils';
import PipelineMetricsEmptyState from './PipelineMetricsEmptyState';
import PipelineMetricsRefreshDropdown from './PipelineMetricsRefreshDropdown';
import PipelineMetricsTimeRangeDropdown from './PipelineMetricsTimeRangeDropdown';
import PipelineRunCount from './PipelineRunCount';
import PipelineRunDurationGraph from './PipelineRunDurationGraph';
import PipelineRunTaskRunGraph from './PipelineRunTaskRunGraph';
import PipelineSuccessRatioDonut from './PipelineSuccessRatioDonut';

import './PipelineMetrics.scss';

const PipelineMetrics: React.FC<PipelineDetailsTabProps> = ({ obj, customData }) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const { queryPrefix } = customData;
  const { t } = useTranslation();
  const latestPipelineRun = useLatestPipelineRun(name, namespace);
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1w'));
  const [interval, setInterval] = React.useState(parsePrometheusDuration('30s'));
  const [loadedGraphs, setLoadedGraphs] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);

  const graphOnLoad = (graphData: GraphData) => {
    if (!loadedGraphs.find((g) => g.chartName === graphData.chartName) && graphData.hasData) {
      setLoadedGraphs([...loadedGraphs, graphData]);
    }
  };
  React.useEffect(() => {
    if (!loaded && loadedGraphs.length === 4) {
      setLoaded(true);
    }
  }, [loaded, loadedGraphs]);

  if (!latestPipelineRun) {
    return <PipelineMetricsEmptyState />;
  }

  return (
    <Stack hasGutter>
      <StackItem className="pipeline-metrics-dashboard__toolbar">
        <Flex>
          <FlexItem>
            <PipelineMetricsTimeRangeDropdown timespan={timespan} setTimespan={setTimespan} />
          </FlexItem>
          <FlexItem>
            <PipelineMetricsRefreshDropdown interval={interval} setInterval={setInterval} />
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem isFilled className="co-m-pane__body pipeline-metrics-dashboard__body">
        <Grid
          sm={1}
          md={1}
          lg={1}
          xl={1}
          xl2={2}
          hasGutter
          className="pipeline-metrics-dashboard__body-content"
        >
          <GridItem xl2={7} xl={12} lg={12} md={12} sm={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>
                  {t('pipelines-plugin~Pipeline Success Ratio')}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <PipelineSuccessRatioDonut
                  interval={interval}
                  timespan={timespan}
                  pipeline={obj}
                  loaded={loaded}
                  onLoad={graphOnLoad}
                  queryPrefix={queryPrefix}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>
          <GridItem xl2={5} xl={12} lg={12} md={12} sm={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>
                  {t('pipelines-plugin~Number of PipelineRuns')}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <PipelineRunCount
                  interval={interval}
                  timespan={timespan}
                  pipeline={obj}
                  loaded={loaded}
                  onLoad={graphOnLoad}
                  queryPrefix={queryPrefix}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>

          <GridItem xl2={7} xl={12} lg={12} md={12} sm={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>
                  {t('pipelines-plugin~PipelineRun Duration')}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <PipelineRunDurationGraph
                  interval={interval}
                  pipeline={obj}
                  timespan={timespan}
                  loaded={loaded}
                  onLoad={graphOnLoad}
                  queryPrefix={queryPrefix}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>
          <GridItem xl2={5} xl={12} lg={12} md={12} sm={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>{t('pipelines-plugin~TaskRun Duration')}</DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <PipelineRunTaskRunGraph
                  interval={interval}
                  timespan={timespan}
                  pipeline={obj}
                  loaded={loaded}
                  onLoad={graphOnLoad}
                  queryPrefix={queryPrefix}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default PipelineMetrics;
