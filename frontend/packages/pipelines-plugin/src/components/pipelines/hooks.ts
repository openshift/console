import { match as RMatch } from 'react-router-dom';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import {
  K8sKind,
  PersistentVolumeClaimKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { pipelinesTab } from '../../utils/pipeline-utils';
import { PipelineRun, getLatestRun } from '../../utils/pipeline-augment';
import { TektonResourceLabel } from './const';
import { PipelineRunModel } from '../../models';

type Match = RMatch<{ url: string }>;

export const usePipelinesBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'pipelines', pipelinesTab(kindObj));

export const useTasksBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'tasks', pipelinesTab(kindObj));

export const useTriggersBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'triggers', pipelinesTab(kindObj));

export const useLatestPipelineRun = (pipelineName: string, namespace: string): PipelineRun => {
  const pipelineRunResource: WatchK8sResource = {
    kind: referenceForModel(PipelineRunModel),
    namespace,
    selector: {
      matchLabels: { [TektonResourceLabel.pipeline]: pipelineName },
    },
    optional: true,
    isList: true,
  };
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] = useK8sWatchResource<PipelineRun[]>(
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
