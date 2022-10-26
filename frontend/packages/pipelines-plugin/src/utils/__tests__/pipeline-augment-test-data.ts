import { PipelineRunKind } from '../../types';
import { PropPipelineData } from '../pipeline-augment';

interface PipelineAugmentData {
  pipelines?: PropPipelineData[];
  pipelineruns?: PipelineRunKind[];
}

export const testData: PipelineAugmentData[] = [
  {},
  { pipelines: [] },
  {
    pipelines: [
      {
        metadata: {
          name: 'apple1',
          namespace: 'myproject',
        },
      },
    ],
    pipelineruns: [
      {
        apiVersion: 'abhiapi/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'apple-1-run1',
          creationTimestamp: '21-05-2019',
          labels: { 'tekton.dev/pipeline': 'apple1' },
        },
        spec: {},
        status: {
          pipelineSpec: { tasks: [] },
          conditions: [{ type: 'Succeeded', status: 'True' }],
        },
      },
    ],
  },
  {
    pipelines: [
      {
        metadata: {
          name: 'apple1',
          namespace: 'myproject',
        },
      },
      {
        metadata: {
          name: 'apple2',
          namespace: 'myproject',
        },
      },
    ],
    pipelineruns: [
      {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          creationTimestamp: '2019-05-30T10:33:14Z',
          generation: 1,
          name: 'simple-pipeline-run-1',
          namespace: 'tekton-pipelines',
          resourceVersion: '345586',
          uid: '7f06aeb0-838f-11e9-8282-525400bab8f1',
          labels: { 'tekton.dev/pipeline': 'apple2' },
        },
        spec: {},
      },
      {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'PipelineRun',
        metadata: {
          creationTimestamp: '2019-05-31T10:33:14Z',
          generation: 1,
          name: 'voting-deploy-pipeline',
          namespace: 'tekton-pipelines',
          resourceVersion: '345587',
          uid: '7f07d2c1-838f-11e9-8282-525400bab8f1',
          labels: { 'tekton.dev/pipeline': 'apple1' },
        },
        spec: {},
      },
      {
        apiVersion: 'abhiapi/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'apple-2-run1',
          creationTimestamp: '31-04-2019',
          labels: { 'tekton.dev/pipeline': 'apple2' },
        },
        spec: {},
        status: {
          pipelineSpec: { tasks: [] },
          conditions: [{ type: 'Succeeded', status: 'True' }],
        },
      },
    ],
  },
];
