import * as React from 'react';
import { parsePrometheusDuration } from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PipelineMetricsLevel } from '../const';
import { PipelineDetailsTabProps } from '../detail-page-tabs/types';
import { useLatestPipelineRun } from '../hooks';
import { GraphData } from './pipeline-metrics-utils';
import PipelineMetricsEmptyState from './PipelineMetricsEmptyState';
import PipelineMetricsQuickstart from './PipelineMetricsQuickstart';
import PipelineMetricsRefreshDropdown from './PipelineMetricsRefreshDropdown';
import PipelineMetricsTimeRangeDropdown from './PipelineMetricsTimeRangeDropdown';
import PipelineMetricsUnsupported from './PipelineMetricsUnsupported';
import PipelineRunCount from './PipelineRunCount';
import PipelineRunDurationGraph from './PipelineRunDurationGraph';
import PipelineRunTaskRunGraph from './PipelineRunTaskRunGraph';
import PipelineSuccessRatioDonut from './PipelineSuccessRatioDonut';

import './PipelineMetrics.scss';

const PipelineMetrics: React.FC<PipelineDetailsTabProps> = ({ obj, customData }) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const { queryPrefix, metricsLevel, hasUpdatePermission } = customData;
  const { t } = useTranslation();
  const latestPipelineRun = useLatestPipelineRun(name, namespace);
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration('1w'));
  const [interval, setInterval] = React.useState(parsePrometheusDuration('30s'));
  const [loadedGraphs, setLoadedGraphs] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const totalGraphs = metricsLevel === PipelineMetricsLevel.PIPELINE_TASK_LEVEL ? 2 : 4;

  const graphOnLoad = React.useCallback(
    (graphData: GraphData) => {
      if (!loadedGraphs.find((g) => g.chartName === graphData.chartName) && graphData.hasData) {
        setLoadedGraphs([...loadedGraphs, graphData]);
      }
    },
    [loadedGraphs],
  );
  React.useEffect(() => {
    if (!loaded && loadedGraphs.length === totalGraphs) {
      setLoaded(true);
    }
  }, [loaded, loadedGraphs, totalGraphs]);

  if (!latestPipelineRun) {
    return <PipelineMetricsEmptyState />;
  }

  if (metricsLevel === PipelineMetricsLevel.UNSUPPORTED_LEVEL) {
    return (
      <PipelineMetricsUnsupported
        updatePermission={hasUpdatePermission}
        metricsLevel={metricsLevel}
      />
    );
  }

  return (
    <Stack hasGutter key={metricsLevel} className="pipeline-metrics">
      <StackItem className="pipeline-metrics-dashboard__toolbar">
        {hasUpdatePermission && metricsLevel === PipelineMetricsLevel.PIPELINE_TASK_LEVEL && (
          <Grid hasGutter style={{ marginBottom: 'var(--pf-global--spacer--lg)' }}>
            <GridItem xl2={12} xl={12} lg={12}>
              <PipelineMetricsQuickstart />
            </GridItem>
          </Grid>
        )}
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
            <Card>
              <CardHeader>
                <CardTitle>{t('pipelines-plugin~Pipeline Success Ratio')}</CardTitle>
              </CardHeader>
              <CardBody>
                <PipelineSuccessRatioDonut
                  interval={interval}
                  timespan={timespan}
                  pipeline={obj}
                  loaded={loaded}
                  onLoad={graphOnLoad}
                  queryPrefix={queryPrefix}
                  metricsLevel={metricsLevel}
                />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xl2={5} xl={12} lg={12} md={12} sm={12}>
            <Card>
              <CardHeader>
                <CardTitle>{t('pipelines-plugin~Number of PipelineRuns')}</CardTitle>
              </CardHeader>
              <CardBody>
                <PipelineRunCount
                  interval={interval}
                  timespan={timespan}
                  pipeline={obj}
                  loaded={loaded}
                  onLoad={graphOnLoad}
                  queryPrefix={queryPrefix}
                  metricsLevel={metricsLevel}
                />
              </CardBody>
            </Card>
          </GridItem>

          {metricsLevel === PipelineMetricsLevel.PIPELINERUN_TASKRUN_LEVEL && (
            <>
              <GridItem xl2={7} xl={12} lg={12} md={12} sm={12}>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('pipelines-plugin~PipelineRun Duration')}</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <PipelineRunDurationGraph
                      interval={interval}
                      pipeline={obj}
                      timespan={timespan}
                      loaded={loaded}
                      onLoad={graphOnLoad}
                      queryPrefix={queryPrefix}
                      metricsLevel={metricsLevel}
                    />
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem xl2={5} xl={12} lg={12} md={12} sm={12}>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('pipelines-plugin~TaskRun Duration')}</CardTitle>
                  </CardHeader>
                  <CardBody className="pipeline-metrics__pipelinerun-taskrun-card-body">
                    <PipelineRunTaskRunGraph
                      interval={interval}
                      timespan={timespan}
                      pipeline={obj}
                      loaded={loaded}
                      onLoad={graphOnLoad}
                      queryPrefix={queryPrefix}
                      metricsLevel={metricsLevel}
                    />
                  </CardBody>
                </Card>
              </GridItem>
            </>
          )}
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default PipelineMetrics;
