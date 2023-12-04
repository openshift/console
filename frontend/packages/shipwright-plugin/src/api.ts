import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { BUILDRUN_TO_BUILD_REFERENCE_LABEL, BUILDRUN_TO_RESOURCE_MAP_LABEL } from './const';
import { BuildRunModel, BuildRunModelV1Alpha1 } from './models';
import { Build, BuildRun } from './types';
import { isV1Alpha1Resource } from './utils';

/** Create a new BuildRun for a given Build to start it. */
export const startBuild = async (build: Build): Promise<BuildRun> => {
  const resourceMapLabel = build.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] || null;
  let newBuildRunData: BuildRun;

  if (isV1Alpha1Resource(build)) {
    newBuildRunData = {
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
  } else {
    newBuildRunData = {
      apiVersion: 'shipwright.io/v1beta1',
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
        build: {
          name: build.metadata.name,
        },
      },
    };
  }
  return k8sCreateResource({
    model: isV1Alpha1Resource(newBuildRunData) ? BuildRunModelV1Alpha1 : BuildRunModel,
    data: newBuildRunData,
  });
};

/**
 * Return if re-run is supported for a specific BuildRun.
 *
 * Checks that BuildRun has a buildRef or buildSpec. Doesn't check any permissions!
 */
export const canRerunBuildRun = (buildRun: BuildRun): boolean => {
  const hasBuildRef = isV1Alpha1Resource(buildRun)
    ? !!buildRun.spec?.buildRef?.name
    : !!buildRun.spec?.build?.name;
  const hasBuildSpec = isV1Alpha1Resource(buildRun)
    ? !!buildRun.spec?.buildSpec
    : !!buildRun.spec?.build?.spec;

  return hasBuildRef || hasBuildSpec;
};

/**
 * Create a new BuildRun for a given BuildRun to re-run it.
 *
 * Will fail for BuildRuns without buildRef or buildSpec. See `canRerunBuildRun`
 */
export const rerunBuildRun = async (buildRun: BuildRun): Promise<BuildRun> => {
  const buildRefName = isV1Alpha1Resource(buildRun)
    ? buildRun.spec?.buildRef?.name
    : buildRun.spec?.build?.name;
  const buildSpec = isV1Alpha1Resource(buildRun)
    ? buildRun.spec?.buildSpec
    : buildRun.spec?.build?.spec;
  const resourceMapLabel = buildRun.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] || null;

  if (buildRefName) {
    const generateName = buildRun.metadata.generateName || `${buildRefName}-`;
    let newBuildRunData: BuildRun;

    if (isV1Alpha1Resource(buildRun)) {
      newBuildRunData = {
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
    } else {
      newBuildRunData = {
        apiVersion: 'shipwright.io/v1beta1',
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
          build: {
            name: buildRefName,
          },
        },
      };
    }

    return k8sCreateResource({
      model: isV1Alpha1Resource(newBuildRunData) ? BuildRunModelV1Alpha1 : BuildRunModel,
      data: newBuildRunData,
    });
  }

  if (buildSpec) {
    const generateName = buildRun.metadata.generateName || `${buildRun.metadata.name}-`;
    let newBuildRunData: BuildRun;

    if (isV1Alpha1Resource(buildRun)) {
      newBuildRunData = {
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
    } else {
      newBuildRunData = {
        apiVersion: 'shipwright.io/v1beta1',
        kind: 'BuildRun',
        metadata: {
          namespace: buildRun.metadata.namespace,
          generateName,
          ...(resourceMapLabel
            ? { labels: { [BUILDRUN_TO_RESOURCE_MAP_LABEL]: resourceMapLabel } }
            : {}),
        },
        spec: {
          build: {
            spec: buildSpec,
          },
        },
      };
    }
    return k8sCreateResource({
      model: isV1Alpha1Resource(newBuildRunData) ? BuildRunModelV1Alpha1 : BuildRunModel,
      data: newBuildRunData,
    });
  }

  if (isV1Alpha1Resource(buildRun)) {
    throw new Error('Could not rerun BuildRun without buildRef.name or inline buildSpec.');
  } else {
    throw new Error('Could not rerun BuildRun without build.name or inline buildSpec.');
  }
};
