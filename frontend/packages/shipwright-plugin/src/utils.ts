import { K8sResourceKind } from '@console/internal/module/k8s';
import { getBuildRunStatus } from './components/buildrun-status/BuildRunStatus';
import { BUILDRUN_TO_RESOURCE_MAP_LABEL } from './const';
import { BuildRun, ComputedBuildRunStatus } from './types';

export type LatestBuildRunStatus = {
  latestBuildRun: BuildRun;
  status: ComputedBuildRunStatus;
};

export interface Runs {
  data?: BuildRun[];
}

export const getLatestRun = (runs: Runs, field: string): BuildRun => {
  if (!runs || !runs.data || !(runs.data.length > 0) || !field) {
    return null;
  }

  let latestRun = runs.data[0];
  if (field === 'creationTimestamp') {
    for (let i = 1; i < runs.data.length; i++) {
      latestRun =
        runs.data[i]?.metadata?.[field] &&
        new Date(runs.data[i].metadata[field]) > new Date(latestRun.metadata[field])
          ? runs.data[i]
          : latestRun;
    }
  } else if (field === 'startTime' || field === 'completionTime') {
    for (let i = 1; i < runs.data.length; i++) {
      latestRun =
        runs.data[i]?.status?.[field] &&
        new Date(runs.data[i].status[field]) > new Date(latestRun.status[field])
          ? runs.data[i]
          : latestRun;
    }
  } else {
    latestRun = runs.data[runs.data.length - 1];
  }
  return latestRun;
};

export const getLatestBuildRunStatusforDeployment = (
  buildRuns: BuildRun[],
  resource: K8sResourceKind,
): LatestBuildRunStatus => {
  const buildRunsforDeployment = buildRuns.filter(
    (run) =>
      run.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] ===
      resource.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL],
  );

  if (!buildRunsforDeployment || buildRunsforDeployment.length === 0) {
    return { latestBuildRun: null, status: ComputedBuildRunStatus.UNKNOWN };
  }

  const latestBuildRun = getLatestRun({ data: buildRunsforDeployment }, 'creationTimestamp');

  if (!latestBuildRun) {
    return { latestBuildRun: null, status: ComputedBuildRunStatus.UNKNOWN };
  }

  const status = getBuildRunStatus(latestBuildRun);

  return {
    latestBuildRun,
    status,
  };
};

export const isBuildRunNewerThen = (newBuildRun: BuildRun, prevBuildRun: BuildRun | undefined) => {
  const prevCreationTime = new Date(prevBuildRun?.metadata?.creationTimestamp);
  const newCreationTime = new Date(newBuildRun?.metadata?.creationTimestamp);
  const timeDifference = newCreationTime.getTime() - prevCreationTime.getTime();
  return timeDifference > 0;
};

export const byCreationTime = (left: K8sResourceKind, right: K8sResourceKind): number => {
  const leftCreationTime = new Date(left?.metadata?.creationTimestamp || Date.now());
  const rightCreationTime = new Date(right?.metadata?.creationTimestamp || Date.now());
  return rightCreationTime.getTime() - leftCreationTime.getTime();
};
