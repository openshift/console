import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { BuildRunModel } from './models';
import { Build, BuildRun } from './types';

export const startBuild = (build: Build): Promise<BuildRun> => {
  // Extracted API call from
  // `shp -v 10 build run s2i-nodejs-build`
  const newBuildRunData: BuildRun = {
    apiVersion: 'shipwright.io/v1alpha1',
    kind: 'BuildRun',
    metadata: {
      namespace: build.metadata.namespace,
      generateName: `${build.metadata.name}-`,
      labels: {
        'build.shipwright.io/name': build.metadata.name,
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

export const canRerunBuildRun = (buildRun: BuildRun): boolean => {
  const buildName = buildRun.spec?.buildRef?.name;
  if (buildName) {
    return true;
  }
  return false;
};

export const rerunBuildRun = (buildRun: BuildRun) => {
  const buildName = buildRun.spec?.buildRef?.name;
  if (buildName) {
    const newBuildRunData: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: buildRun.metadata.namespace,
        generateName: `${buildName}-`,
        labels: {
          'build.shipwright.io/name': buildName,
        },
      },
      spec: {
        buildRef: {
          name: buildName,
        },
      },
    };
    return k8sCreateResource({
      model: BuildRunModel,
      data: newBuildRunData,
    });
  }
  throw new Error('Could not rerun BuildRun without buildRef.');
};
