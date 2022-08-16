import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { startBuild, canRerunBuildRun, rerunBuildRun } from '../api';
import { BuildRunModel } from '../models';
import { Build, BuildRun } from '../types';
import {
  incompleteBuild,
  incompleteBuildRun,
  buildRunReferenceIncompleteBuildWithoutGenerateName,
  buildRunReferenceIncompleteBuildWithGenerateName,
  buildRunContainsIncompleteBuildSpecWithoutGenerateName,
  buildRunContainsIncompleteBuildSpecWithGenerateName,
  buildRunWithLabels,
  buildWithLabels,
} from './mock-data';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sCreateResource: jest.fn(),
}));

const k8sCreateResourceMock = k8sCreateResource as jest.Mock;

beforeEach(() => jest.resetAllMocks());

describe('startBuild', () => {
  it('should create a new BuildRun referencing a Build', async () => {
    const build: Build = incompleteBuild;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'incomplete-build-',
        labels: {
          'build.shipwright.io/name': 'incomplete-build',
        },
      },
      spec: {
        buildRef: {
          name: 'incomplete-build',
        },
      },
    };

    await startBuild(build);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });

  it('should create a new BuildRun with Labels present in Build', async () => {
    const build: Build = buildWithLabels;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'build-with-labels-',
        labels: {
          'build.shipwright.io/name': 'build-with-labels',
          'app.kubernetes.io/part-of': 'buildpack-nodejs-build',
        },
      },
      spec: {
        buildRef: {
          name: 'build-with-labels',
        },
      },
    };

    await startBuild(build);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });
});

describe('canRerunBuildRun', () => {
  it('should allow user to rerun BuildRun that referencing a Build', () => {
    expect(canRerunBuildRun(buildRunReferenceIncompleteBuildWithoutGenerateName)).toBe(true);
    expect(canRerunBuildRun(buildRunReferenceIncompleteBuildWithGenerateName)).toBe(true);
  });

  it('should allow user to rerun BuildRun that contains a inline BuildSpec', () => {
    expect(canRerunBuildRun(buildRunContainsIncompleteBuildSpecWithoutGenerateName)).toBe(true);
    expect(canRerunBuildRun(buildRunContainsIncompleteBuildSpecWithGenerateName)).toBe(true);
  });

  it('should not allow user to rerun an incomplete BuildRun', () => {
    expect(canRerunBuildRun(incompleteBuildRun)).toBe(false);
  });
});

describe('rerunBuildRun', () => {
  it('should create another BuildRun when rerun a BuildRun that referencing a Build without generateName', async () => {
    const buildRun: BuildRun = buildRunReferenceIncompleteBuildWithoutGenerateName;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'incomplete-build-',
        labels: {
          'build.shipwright.io/name': 'incomplete-build',
        },
      },
      spec: {
        buildRef: {
          name: 'incomplete-build',
        },
      },
    };

    await rerunBuildRun(buildRun);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });

  it('should create another BuildRun when rerun a BuildRun that referencing a Build with generateName', async () => {
    const buildRun: BuildRun = buildRunReferenceIncompleteBuildWithGenerateName;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'buildrun2-',
        labels: {
          'build.shipwright.io/name': 'incomplete-build',
        },
      },
      spec: {
        buildRef: {
          name: 'incomplete-build',
        },
      },
    };

    await rerunBuildRun(buildRun);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });

  it('should create another BuildRun when rerun a BuildRun that contains an inline BuildSpec without generateName', async () => {
    const buildRun: BuildRun = buildRunContainsIncompleteBuildSpecWithoutGenerateName;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'buildrun3-33333-',
      },
      spec: {
        buildSpec: {},
      },
    };

    await rerunBuildRun(buildRun);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });

  it('should create another BuildRun when rerun a BuildRun that contains an inline BuildSpec with generateName', async () => {
    const buildRun: BuildRun = buildRunContainsIncompleteBuildSpecWithGenerateName;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'buildrun4-',
      },
      spec: {
        buildSpec: {},
      },
    };

    await rerunBuildRun(buildRun);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });

  it('should fail when try to rerun an incomplete BuildRun without buildRef and without buildSpec', async () => {
    const buildRun: BuildRun = incompleteBuildRun;

    await expect(rerunBuildRun(buildRun)).rejects.toEqual(
      new Error('Could not rerun BuildRun without buildRef.name or inline buildSpec.'),
    );
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(0);
  });

  it('should rerun a BuildRun with the labels from the existing BuildRun', async () => {
    const buildRun: BuildRun = buildRunWithLabels;
    const expectedBuildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        generateName: 'buildrun-with-labels-',
        labels: {
          'build.shipwright.io/name': 'build-with-labels',
          'app.kubernetes.io/part-of': 'buildpack-nodejs-build',
        },
      },
      spec: {
        buildRef: {
          name: 'build-with-labels',
        },
      },
    };

    await rerunBuildRun(buildRun);
    expect(k8sCreateResourceMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateResourceMock).toHaveBeenCalledWith({
      model: BuildRunModel,
      data: expectedBuildRun,
    });
  });
});
