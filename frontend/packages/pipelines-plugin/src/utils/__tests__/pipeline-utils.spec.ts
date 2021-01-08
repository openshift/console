import * as _ from 'lodash';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import * as k8s from '@console/internal/module/k8s';
import { ContainerStatus } from '@console/internal/module/k8s';
import { SecretAnnotationId } from '../../components/pipelines/const';
import { runStatus } from '../pipeline-augment';
import {
  getPipelineTasks,
  containerToLogSourceStatus,
  getLatestPipelineRunStatus,
  getPipelineRunParams,
  pipelineRunDuration,
  getSecretAnnotations,
  calculateRelativeTime,
  hasInlineTaskSpec,
  LatestPipelineRunStatus,
  updateServiceAccount,
} from '../pipeline-utils';
import {
  constructPipelineData,
  mockPipelinesJSON,
  mockRunDurationTest,
} from './pipeline-test-data';
import { mockPipelineServiceAccount } from './pipeline-serviceaccount-test-data';

beforeAll(() => {
  jest.spyOn(k8s, 'k8sUpdate').mockImplementation((model, data) => data);
});

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

  it('should expect getLatestPipelineRunStatus to return a non-started state if not provided with valid data', () => {
    const emptyState: LatestPipelineRunStatus = {
      latestPipelineRun: null,
      status: runStatus.PipelineNotStarted,
    };
    expect(getLatestPipelineRunStatus(null)).toEqual(emptyState);
    expect(getLatestPipelineRunStatus([])).toEqual(emptyState);
  });

  it('should expect getLatestPipelineRunStatus to return the latest pipeline run', () => {
    const data = getLatestPipelineRunStatus(constructPipelineData.pipelineRuns);

    expect(data).not.toBeNull();
    expect(data.latestPipelineRun).not.toBeNull();
    expect(data.latestPipelineRun).not.toBeUndefined();
    expect(data.latestPipelineRun).not.toBeNull();
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
    expect(duration).toBe('about a minute');
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

  it('expected relative time should be "a few seconds"', () => {
    const relativeTime = calculateRelativeTime('2020-05-22T11:57:53Z', '2020-05-22T11:57:57Z');
    expect(relativeTime).toBe('a few seconds');
  });

  it('expected relative time should be "about a minute"', () => {
    const relativeTime = calculateRelativeTime('2020-05-22T10:57:00Z', '2020-05-22T10:57:57Z');
    expect(relativeTime).toBe('about a minute');
  });

  it('expected relative time should be "about 4 minutes"', () => {
    const relativeTime = calculateRelativeTime('2020-05-22T11:57:53Z', '2020-05-22T12:02:20Z');
    expect(relativeTime).toBe('about 4 minutes');
  });

  it('expected relative time should be "about an hour"', () => {
    const relativeTime = calculateRelativeTime('2020-05-22T11:57:53Z', '2020-05-22T12:57:57Z');
    expect(relativeTime).toBe('about an hour');
  });

  it('expected relative time should be "about 2 hours"', () => {
    const relativeTime = calculateRelativeTime('2020-05-22T10:57:53Z', '2020-05-22T12:57:57Z');
    expect(relativeTime).toBe('about 2 hours');
  });

  it('expect pipeline with inline task spec to return true', () => {
    const hasSpec = hasInlineTaskSpec(mockPipelinesJSON[2].spec.tasks);
    expect(hasSpec).toBe(true);
  });

  it('expect pipeline without inline task spec to return false', () => {
    const hasSpec = hasInlineTaskSpec(mockPipelinesJSON[0].spec.tasks);
    expect(hasSpec).toBe(false);
  });

  it('expect service account to have secret name available only in secrets property', async () => {
    const gitSecretName = 'git-secret';
    const serviceAccount = await updateServiceAccount(
      gitSecretName,
      mockPipelineServiceAccount,
      false,
    );
    expect(serviceAccount.secrets.find((s) => s.name === gitSecretName)).toBeDefined();
    expect(serviceAccount.imagePullSecrets.find((s) => s.name === gitSecretName)).toBeUndefined();
    expect(serviceAccount.secrets).toHaveLength(2);
    expect(serviceAccount.imagePullSecrets).toHaveLength(1);
  });

  it('expect service account to have secret name available in secrets and imagePullSecrets properties', async () => {
    const imageSecretName = 'image-secret';
    const serviceAccount = await updateServiceAccount(
      imageSecretName,
      mockPipelineServiceAccount,
      true,
    );
    expect(serviceAccount.secrets.find((s) => s.name === imageSecretName)).toBeDefined();
    expect(serviceAccount.imagePullSecrets.find((s) => s.name === imageSecretName)).toBeDefined();
    expect(serviceAccount.secrets).toHaveLength(2);
    expect(serviceAccount.imagePullSecrets).toHaveLength(2);
  });
});
