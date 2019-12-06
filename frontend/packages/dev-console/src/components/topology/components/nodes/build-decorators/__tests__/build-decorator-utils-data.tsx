import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../../../test/pipeline-data';
import { ConnectedWorkloadPipeline, WorkloadData } from '../../../../topology-types';

export const bareMinimalWorkloadData: WorkloadData = {
  build: null,
  connectedPipeline: null,
  donutStatus: null,
};

const connectedPipelineOne: ConnectedWorkloadPipeline = {
  pipeline: pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline,
  pipelineRuns: [
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS],
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.IN_PROGRESS],
  ],
};

const buildData = {
  metadata: {
    annotations: {
      'openshift.io/build-config.name': 'react-web-app',
      'openshift.io/build.number': '1',
      'openshift.io/build.pod-name': 'react-web-app-1-build',
    },
    selfLink: '/apis/build.openshift.io/v1/namespaces/andrew-test/builds/react-web-app-1',
    resourceVersion: '696608',
    name: 'react-web-app-1',
    uid: 'fd52472d-f752-11e9-81ae-0a580a810022',
    creationTimestamp: '2019-10-25T18:12:22Z',
    namespace: 'andrew-test',
    ownerReferences: [
      {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        name: 'react-web-app',
        uid: 'fd28333b-f752-11e9-81ae-0a580a810022',
        controller: true,
      },
    ],
    labels: {
      app: 'react-web-app',
      'app.kubernetes.io/part-of': 'react-web-app-app',
      'app.kubernetes.io/instance': 'react-web-app',
      'openshift.io/build-config.name': 'react-web-app',
      'app.kubernetes.io/component': 'react-web-app',
      'openshift.io/build.start-policy': 'Serial',
      buildconfig: 'react-web-app',
      'app.openshift.io/runtime': 'modern-webapp',
      'app.kubernetes.io/name': 'modern-webapp',
      'app.openshift.io/runtime-version': '10.x',
    },
  },
  spec: {
    nodeSelector: null,
    output: {
      to: { kind: 'ImageStreamTag', name: 'react-web-app:latest' },
      pushSecret: { name: 'builder-dockercfg-9jcf2' },
    },
    resources: {},
    triggeredBy: [
      {
        message: 'Image change',
        imageChangeBuild: {
          imageID:
            'image-registry.openshift-image-registry.svc:5000/openshift/modern-webapp@sha256:eb672caddbf6f1d2283ecc2e7f69142bd605f5a0067c951dd9b829f29343edc4',
          fromRef: { kind: 'ImageStreamTag', namespace: 'openshift', name: 'modern-webapp:10.x' },
        },
      },
    ],
    strategy: {
      type: 'Source',
      sourceStrategy: {
        from: {
          kind: 'DockerImage',
          name:
            'image-registry.openshift-image-registry.svc:5000/openshift/modern-webapp@sha256:eb672caddbf6f1d2283ecc2e7f69142bd605f5a0067c951dd9b829f29343edc4',
        },
        pullSecret: { name: 'builder-dockercfg-9jcf2' },
      },
    },
    postCommit: {},
    serviceAccount: 'builder',
    source: {
      type: 'Git',
      git: { uri: 'https://github.com/nodeshift-starters/react-web-app' },
      contextDir: '/',
    },
    revision: {
      type: 'Git',
      git: {
        commit: '32b53d1a23d8148077f2095226bd4e8afcd1ce4a',
        author: { name: 'Lucas Holmquist', email: 'lholmqui@redhat.com' },
        committer: { name: 'Lucas Holmquist', email: 'lholmqui@redhat.com' },
        message: 'chore: text updates',
      },
    },
  },
  status: {
    phase: 'Running',
    startTimestamp: '2019-10-25T18:12:22Z',
    outputDockerImageReference:
      'image-registry.openshift-image-registry.svc:5000/andrew-test/react-web-app:latest',
    config: { kind: 'BuildConfig', namespace: 'andrew-test', name: 'react-web-app' },
    output: {},
    stages: [
      {
        name: 'FetchInputs',
        startTime: '2019-10-25T18:12:30Z',
        durationMilliseconds: 479,
        steps: [
          { name: 'FetchGitSource', startTime: '2019-10-25T18:12:30Z', durationMilliseconds: 479 },
        ],
      },
    ],
  },
};

export const buildAndPipelineData: WorkloadData = {
  build: buildData,
  connectedPipeline: connectedPipelineOne,
  donutStatus: null,
};

export const buildOnlyData: WorkloadData = {
  build: buildData,
  connectedPipeline: { pipeline: null, pipelineRuns: [] },
  donutStatus: null,
};
