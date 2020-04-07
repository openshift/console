import * as _ from 'lodash';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import { ContainerStatus } from '@console/internal/module/k8s';
import { SecretAnnotationId } from '../../components/pipelines/const';
import {
  getPipelineTasks,
  containerToLogSourceStatus,
  constructCurrentPipeline,
  getPipelineRunParams,
  pipelineRunDuration,
  getSecretAnnotations,
} from '../pipeline-utils';
import {
  constructPipelineData,
  mockPipelinesJSON,
  mockRunDurationTest,
} from './pipeline-test-data';

describe('pipeline-utils ', () => {
  it('For first pipeline there should be 1 stages of length 2', () => {
    const stages = getPipelineTasks(mockPipelinesJSON[0]);
    expect(stages).toHaveLength(1);
    expect(stages[0]).toHaveLength(2);
  });
  it('should transform pipelines', () => {
    const stages = getPipelineTasks(mockPipelinesJSON[1]);
    expect(stages).toHaveLength(4);
    expect(stages[0]).toHaveLength(1);
    expect(stages[1]).toHaveLength(2);
    expect(stages[2]).toHaveLength(2);
    expect(stages[3]).toHaveLength(1);
  });

  it('should return correct Container Status', () => {
    let status = containerToLogSourceStatus({
      name: 'test',
      state: { waiting: {} },
    } as ContainerStatus);
    expect(status).toBe(LOG_SOURCE_WAITING);
    status = containerToLogSourceStatus({
      name: 'test',
      state: { waiting: {} },
      lastState: { [LOG_SOURCE_WAITING]: {} },
    } as ContainerStatus);
    expect(status).toBe(LOG_SOURCE_RESTARTING);
    status = containerToLogSourceStatus({
      name: 'test',
      state: { running: {} },
    } as ContainerStatus);
    expect(status).toBe(LOG_SOURCE_RUNNING);
    status = containerToLogSourceStatus({
      name: 'test',
      state: { terminated: {} },
    } as ContainerStatus);
    expect(status).toBe(LOG_SOURCE_TERMINATED);
  });

  it('expect constructCurrentPipeline to return nothing if not provided with valid data', () => {
    expect(constructCurrentPipeline(null, null)).toBeNull();
    expect(constructCurrentPipeline(constructPipelineData.pipeline, null)).toBeNull();
    expect(constructCurrentPipeline(constructPipelineData.pipeline, [])).toBeNull();
    expect(constructCurrentPipeline(null, constructPipelineData.pipelineRuns)).toBeNull();
  });

  it('expect constructCurrentPipeline to produce a grouped pipeline with the latest run', () => {
    const data = constructCurrentPipeline(
      constructPipelineData.pipeline,
      constructPipelineData.pipelineRuns,
    );

    expect(data).not.toBeNull();
    expect(data.currentPipeline).not.toBeNull();
    expect(data.currentPipeline.latestRun).not.toBeUndefined();
    expect(data.currentPipeline.latestRun).not.toBeNull();
    expect(data.status).not.toBeNull();
    expect(data.status).toBe('Pending');
  });

  it('should return correct params for a pipeline run', () => {
    const pipelineParams = _.get(mockPipelinesJSON[0], 'spec.params');
    const params = getPipelineRunParams(pipelineParams);
    expect(params[0].name).toBe('APP_NAME');
    expect(params[0].value).toBe('default-app-name');
  });

  it('expect duration to be "-" for PipelineRun without start Time', () => {
    const duration = pipelineRunDuration(mockRunDurationTest[0]);
    expect(duration).not.toBeNull();
    expect(duration).toBe('-');
  });

  it('expect duration to be "-" for non running PipelineRun without end Time', () => {
    const duration = pipelineRunDuration(mockRunDurationTest[1]);
    expect(duration).not.toBeNull();
    expect(duration).toBe('-');
  });

  it('expect duration to be a time formatted string for PipelineRun with start and end Time', () => {
    const duration = pipelineRunDuration(mockRunDurationTest[2]);
    expect(duration).not.toBeNull();
    expect(duration).toBe('1m 13s');
  });
  it('expect annotation to return an empty object if keyValue pair is not passed', () => {
    const annotation = getSecretAnnotations(null);
    expect(annotation).toEqual({});
  });

  it('expect annotation to have a valid git annotation key and value', () => {
    const annotation = getSecretAnnotations({
      key: SecretAnnotationId.Git,
      value: 'github.com',
    });
    expect(annotation).toEqual({
      'tekton.dev/git-0': 'github.com',
    });
  });

  it('expect annotation to have a valid image annotation key and value', () => {
    const annotation = getSecretAnnotations({
      key: SecretAnnotationId.Image,
      value: 'docker.io',
    });
    expect(annotation).toEqual({
      'tekton.dev/docker-0': 'docker.io',
    });
  });
});
