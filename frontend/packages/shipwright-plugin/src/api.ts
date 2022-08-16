import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { BUILDRUN_TO_BUILD_REFERENCE_LABEL, BUILDRUN_TO_RESOURCE_MAP_LABEL } from './const';
import { BuildRunModel } from './models';
import { Build, BuildRun } from './types';

/** Create a new BuildRun for a given Build to start it. */
export const startBuild = async (build: Build): Promise<BuildRun> => {
  const resourceMapLabel = build.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] || null;
  const newBuildRunData: BuildRun = {
    apiVersion: 'shipwright.io/v1alpha1',
    kind: 'BuildRun',
    metadata: {
      namespace: build.metadata.namespace,
      generateName: `${build.metadata.name}-`,
      labels: {
        [BUILDRUN_TO_BUILD_REFERENCE_LABEL]: build.metadata.name,
        ...(resourceMapLabel ? { [BUILDRUN_TO_RESOURCE_MAP_LABEL]: resourceMapLabel } : {}),
      },
    },
    spec: {
      buildRef: {
        name: build.metadata.name,
      },
    },
  };
  return k8sCreateResource({
    model: BuildRunModel,
    data: newBuildRunData,
  });
};

/**
 * Return if re-run is supported for a specific BuildRun.
 *
 * Checks that BuildRun has a buildRef or buildSpec. Doesn't check any permissions!
 */
export const canRerunBuildRun = (buildRun: BuildRun): boolean => {
  const hasBuildRef = !!buildRun.spec?.buildRef?.name;
  const hasBuildSpec = !!buildRun.spec?.buildSpec;
  return hasBuildRef || hasBuildSpec;
};

/**
 * Create a new BuildRun for a given BuildRun to re-run it.
 *
 * Will fail for BuildRuns without buildRef or buildSpec. See `canRerunBuildRun`
 */
export const rerunBuildRun = async (buildRun: BuildRun): Promise<BuildRun> => {
  const buildRefName = buildRun.spec?.buildRef?.name;
  const buildSpec = buildRun.spec?.buildSpec;
  const resourceMapLabel = buildRun.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] || null;

  if (buildRefName) {
    const generateName = buildRun.metadata.generateName || `${buildRefName}-`;
    const newBuildRunData: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: buildRun.metadata.namespace,
        generateName,
        labels: {
          [BUILDRUN_TO_BUILD_REFERENCE_LABEL]: buildRefName,
          ...(resourceMapLabel ? { [BUILDRUN_TO_RESOURCE_MAP_LABEL]: resourceMapLabel } : {}),
        },
      },
      spec: {
        buildRef: {
          name: buildRefName,
        },
      },
    };
    return k8sCreateResource({
      model: BuildRunModel,
      data: newBuildRunData,
    });
  }

  if (buildSpec) {
    const generateName = buildRun.metadata.generateName || `${buildRun.metadata.name}-`;

    const newBuildRunData: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: buildRun.metadata.namespace,
        generateName,
        ...(resourceMapLabel
          ? { labels: { [BUILDRUN_TO_RESOURCE_MAP_LABEL]: resourceMapLabel } }
          : {}),
      },
      spec: {
        buildSpec,
      },
    };
    return k8sCreateResource({
      model: BuildRunModel,
      data: newBuildRunData,
    });
  }

  throw new Error('Could not rerun BuildRun without buildRef.name or inline buildSpec.');
};
