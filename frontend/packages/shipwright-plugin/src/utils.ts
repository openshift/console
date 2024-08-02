import { IBuild as IBuildV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/Build';
import { IBuildRun as IBuildRunV1Alpha1 } from '@kubernetes-models/shipwright/shipwright.io/v1alpha1/BuildRun';
import { useLocation, useParams } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/lib-core';
import { K8sResourceCondition, K8sResourceKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { getBuildRunStatus } from './components/buildrun-status/BuildRunStatus';
import { BUILDRUN_TO_RESOURCE_MAP_LABEL } from './const';
import {
  BuildModel,
  BuildModelV1Alpha1,
  BuildRunModel,
  BuildRunModelV1Alpha1,
  BuildStrategyModel,
  BuildStrategyModelV1Alpha1,
  ClusterBuildStrategyModel,
  ClusterBuildStrategyModelV1Alpha1,
} from './models';
import { Build, BuildRun, ComputedBuildRunStatus } from './types';

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

export const isV1Alpha1Resource = (
  resource: Build | BuildRun,
): resource is
  | IBuildV1Alpha1
  | (IBuildRunV1Alpha1 & { status?: { conditions?: K8sResourceCondition[] } }) => {
  return resource.apiVersion === 'shipwright.io/v1alpha1';
};

export const getBuildNameFromBuildRun = (buildRun: BuildRun) => {
  if (isV1Alpha1Resource(buildRun)) {
    return buildRun.spec?.buildRef?.name;
  }
  return buildRun.spec?.build?.name;
};

/**
 * Given two flags that determine the presence of two versions of a CRD,
 * determine which version is enabled.
 *
 * If both flags are enabled, the first model gets priority.
 *
 * @return the K8s model of the CRD that is enabled, or null if neither are enabled
 */
const useDetermineModelVersion = (
  modelOne: K8sModel,
  modelTwo: K8sModel,
  modelFlagOne: string,
  modelFlagTwo: string,
) => {
  const flagTwo = useFlag(modelFlagTwo);
  const flagOne = useFlag(modelFlagOne);

  if (!flagTwo && !flagOne) {
    return null;
  }

  return flagOne ? modelOne : modelTwo;
};

/**
 * @returns latest `BuildModel` model if exists, otherwise v1Alpha1 if it exists, otherwise null
 */
export const useBuildModel = () =>
  useDetermineModelVersion(
    BuildModel,
    BuildModelV1Alpha1,
    'SHIPWRIGHT_BUILD',
    'SHIPWRIGHT_BUILD_V1ALPHA1',
  );

/**
 * @returns latest `BuildRunModel` model if exists, otherwise v1Alpha1 if it exists, otherwise null
 */
export const useBuildRunModel = () =>
  useDetermineModelVersion(
    BuildRunModel,
    BuildRunModelV1Alpha1,
    'SHIPWRIGHT_BUILDRUN',
    'SHIPWRIGHT_BUILDRUN_V1ALPHA1',
  );

/**
 * @returns latest `BuildStrategyModel` model if exists, otherwise v1Alpha1 if it exists, otherwise null
 */
export const useBuildStrategyModel = () =>
  useDetermineModelVersion(
    BuildStrategyModel,
    BuildStrategyModelV1Alpha1,
    'SHIPWRIGHT_BUILDSTRATEGY',
    'SHIPWRIGHT_BUILDSTRATEGY_V1ALPHA1',
  );

/**
 * @returns latest `ClusterBuildStrategyModel` model if exists, otherwise v1Alpha1 if it exists, otherwise null
 */
export const useClusterBuildStrategyModel = () =>
  useDetermineModelVersion(
    ClusterBuildStrategyModel,
    ClusterBuildStrategyModelV1Alpha1,
    'SHIPWRIGHT_CLUSTERBUILDSTRATEGY',
    'SHIPWRIGHT_CLUSTERBUILDSTRATEGY_V1ALPHA1',
  );

/** map of shipwright kinds to tab names */
const kindToTabMap = {
  [BuildModel.kind]: 'builds',
  [BuildModelV1Alpha1.kind]: 'builds',
  [BuildRunModel.kind]: 'buildruns',
  [BuildRunModelV1Alpha1.kind]: 'buildruns',
  [BuildStrategyModel.kind]: 'buildstrategies',
  [BuildStrategyModelV1Alpha1.kind]: 'buildstrategies',
  [ClusterBuildStrategyModel.kind]: 'clusterbuildstrategies',
  [ClusterBuildStrategyModelV1Alpha1.kind]: 'clusterbuildstrategies',
};

/** convert a resource using a shipwright model to its corresponding k8s model */
const resourceToModel = (obj: K8sResourceKind): K8sModel => {
  if (obj?.apiVersion === 'shipwright.io/v1alpha1') {
    switch (obj?.kind) {
      case 'Build':
        return BuildModelV1Alpha1;
      case 'BuildRun':
        return BuildRunModelV1Alpha1;
      case 'BuildStrategy':
        return BuildStrategyModelV1Alpha1;
      case 'ClusterBuildStrategy':
        return ClusterBuildStrategyModelV1Alpha1;
      default:
        return null;
    }
  }
  switch (obj?.kind) {
    case 'Build':
      return BuildModel;
    case 'BuildRun':
      return BuildRunModel;
    case 'BuildStrategy':
      return BuildStrategyModel;
    case 'ClusterBuildStrategy':
      return ClusterBuildStrategyModel;
    default:
      return null;
  }
};

export const useShipwrightBreadcrumbsFor = (obj: K8sResourceKind) => {
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const params = useParams();
  const location = useLocation();
  return useTabbedTableBreadcrumbsFor(
    resourceToModel(obj),
    location,
    params,
    'k8s',
    `shipwright.io/${kindToTabMap[obj.kind]}`,
    undefined,
    isAdminPerspective,
  );
};
