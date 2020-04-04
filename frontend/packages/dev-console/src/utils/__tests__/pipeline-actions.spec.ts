import { PipelineModel, PipelineRunModel } from '../../models';
import {
  stopPipelineRun,
  rerunPipelineAndRedirect,
  reRunPipelineRun,
  startPipeline,
} from '../pipeline-actions';
import { PipelineRun, Pipeline } from '../pipeline-augment';

export const actionPipelines: Pipeline[] = [
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'sansa-stark', namespace: 'corazon' },
    spec: {
      params: [{ name: 'APP_NAME', description: 'Described Param', default: 'default-app-name' }],
      tasks: [],
    },
  },
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'danaerys-targaeryen', namespace: 'corazon' },
    spec: {
      tasks: [],
    },
  },
];

export const actionPipelineRuns: PipelineRun[] = [
  {
    apiVersion: 'abhiapi/v1',
    kind: 'PipelineRun',
    metadata: { name: 'winterfell', namespace: 'corazon' },
    spec: { pipelineRef: { name: 'sansa-stark' } },
    status: { creationTimestamp: '31', conditions: [{ type: 'Succeeded', status: 'True' }] },
  },
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'dragonstone', namespace: 'corazon' },
    spec: { pipelineRef: { name: 'danaerys-targaeryen' } },
    status: { creationTimestamp: '31', conditions: [{ type: 'Succeeded', status: 'Unknown' }] },
  },
];

describe('PipelineAction testing rerunPipeline create correct labels and callbacks', () => {
  it('expect label to be "Start Last Run" when latestRun is available', () => {
    const rerunAction = rerunPipelineAndRedirect(PipelineRunModel, actionPipelineRuns[0]);
    expect(rerunAction.label).toBe('Start Last Run');
    expect(rerunAction.callback).not.toBeNull();
  });
});

describe('PipelineAction testing reRunPipelineRun create correct labels and callbacks', () => {
  it('expect label to be "Rerun" when latestRun is available', () => {
    const rerunAction = reRunPipelineRun(PipelineRunModel, actionPipelineRuns[0]);
    expect(rerunAction.label).toBe('Rerun');
    expect(rerunAction.callback).not.toBeNull();
  });
});

describe('PipelineAction testing startPipeline create correct labels and callbacks', () => {
  it('expect label to be "Start" when latestRun is available', () => {
    const rerunAction = startPipeline(PipelineModel, actionPipelines[0]);
    expect(rerunAction.label).toBe('Start');
    expect(rerunAction.callback).not.toBeNull();
  });
});

describe('PipelineAction testing stopPipelineRun create correct labels and callbacks', () => {
  it('expect label to be "Stop" with hidden flag as false when latest Run is running', () => {
    const stopAction = stopPipelineRun(PipelineRunModel, actionPipelineRuns[1]);
    expect(stopAction.label).toBe('Stop');
    expect(stopAction.callback).not.toBeNull();
    expect(stopAction.hidden).toBeFalsy();
  });

  it('expect label to be "Stop" with hidden flag as true when latest Run is not running', () => {
    const stopAction = stopPipelineRun(PipelineRunModel, actionPipelineRuns[0]);
    expect(stopAction.label).toBe('Stop');
    expect(stopAction.callback).not.toBeNull();
    expect(stopAction.hidden).not.toBeFalsy();
  });
});
