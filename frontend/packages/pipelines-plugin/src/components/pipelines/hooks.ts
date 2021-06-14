import { match as RMatch } from 'react-router-dom';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import {
  K8sKind,
  PersistentVolumeClaimKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { getLatestRun } from '../../utils/pipeline-augment';
import { pipelinesTab } from '../../utils/pipeline-utils';
import { DEFAULT_SAMPLES, TektonResourceLabel } from './const';
import { metricQueries, PipelineQuery } from './pipeline-metrics/pipeline-metrics-utils';

type Match = RMatch<{ url: string }>;

export const usePipelinesBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'pipelines', pipelinesTab(kindObj));

export const useTasksBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'tasks', pipelinesTab(kindObj));

export const useTriggersBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'triggers', pipelinesTab(kindObj));

export const useLatestPipelineRun = (pipelineName: string, namespace: string): PipelineRunKind => {
  const pipelineRunResource: WatchK8sResource = {
    kind: referenceForModel(PipelineRunModel),
    namespace,
    selector: {
      matchLabels: { [TektonResourceLabel.pipeline]: pipelineName },
    },
    optional: true,
    isList: true,
  };
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] = useK8sWatchResource<PipelineRunKind[]>(
    pipelineRunResource,
  );
  const latestRun = getLatestRun({ data: pipelineRun }, 'creationTimestamp');
  return pipelineRunLoaded && !pipelineRunError ? latestRun : null;
};

export const usePipelinePVC = (
  pipelineName: string,
  namespace: string,
): [PersistentVolumeClaimKind, boolean] => {
  const pvcResource: WatchK8sResource = {
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    selector: {
      matchLabels: { [TektonResourceLabel.pipeline]: pipelineName },
    },
    optional: true,
    isList: true,
  };
  const [PVC, PVCLoaded, PVCError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(pvcResource);
  return [!PVCError && PVC.length > 0 ? PVC[0] : null, PVCLoaded];
};

export const usePipelineSuccessRatioPoll = ({ delay, namespace, name, timespan, queryPrefix }) => {
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: metricQueries(queryPrefix)[PipelineQuery.PIPELINE_SUCCESS_RATIO]({ name, namespace }),
      samples: 1,
      endTime: Date.now(),
      timespan,
    }),
    delay,
    namespace,
    timespan,
  );
};

export const usePipelineRunTaskRunPoll = ({ delay, namespace, name, timespan, queryPrefix }) => {
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: metricQueries(queryPrefix)[PipelineQuery.PIPELINE_RUN_TASK_RUN_DURATION]({
        name,
        namespace,
      }),
      samples: DEFAULT_SAMPLES,
      endTime: Date.now(),
      timespan,
    }),
    delay,
    namespace,
    timespan,
  );
};

export const usePipelineRunDurationPoll = ({
  delay,
  namespace,
  name,
  timespan,
  queryPrefix,
}): any => {
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: metricQueries(queryPrefix)[PipelineQuery.PIPELINE_RUN_DURATION]({ name, namespace }),
      samples: DEFAULT_SAMPLES,
      endTime: Date.now(),
      timespan,
    }),
    delay,
    namespace,
    timespan,
  );
};

export const usePipelineRunPoll = ({ delay, namespace, name, timespan, queryPrefix }) => {
  return useURLPoll<PrometheusResponse>(
    getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      query: metricQueries(queryPrefix)[PipelineQuery.NUMBER_OF_PIPELINE_RUNS]({ name, namespace }),
      samples: DEFAULT_SAMPLES,
      endTime: Date.now(),
      timespan,
    }),
    delay,
    namespace,
    timespan,
  );
};
