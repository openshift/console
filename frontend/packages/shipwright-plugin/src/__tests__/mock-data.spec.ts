import { Build, BuildRun } from '../types';

export const incompleteBuild: Build = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'Build',
  metadata: {
    namespace: 'a-namespace',
    name: 'a-incomplete-build',
  },
};

export const incompleteBuildRun: BuildRun = {
  apiVersion: 'shipwright.io/v1alpha1',
  kind: 'BuildRun',
  metadata: {
    namespace: 'a-namespace',
    name: 'a-incomplete-buildrun',
  },
};
