import { PipelineModel, PipelineRunModel } from '../../models';
import {
  stopPipelineRun,
  rerunPipelineAndRedirect,
  reRunPipelineRun,
  startPipeline,
  getPipelineKebabActions,
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

describe('getPipelineKebabActions', () => {
  it('expect Remove Trigger option is present', () => {
    const pipelineKebabActions = getPipelineKebabActions(actionPipelineRuns[0], true);
    expect(pipelineKebabActions.length).toBe(6);
    expect(pipelineKebabActions[3](PipelineModel, actionPipelines[0]).label).toBe('Remove Trigger');
  });
  it('expect Remove Trigger option is not present', () => {
    const pipelineKebabActions = getPipelineKebabActions(actionPipelineRuns[0], false);
    expect(pipelineKebabActions.length).toBe(5);
    expect(pipelineKebabActions[3](PipelineModel, actionPipelines[0]).label).not.toBe(
      'Remove Trigger',
    );
  });
  it('expect Start Last Run option is present', () => {
    const pipelineKebabActions = getPipelineKebabActions(actionPipelineRuns[0], false);
    expect(pipelineKebabActions.length).toBe(5);
    expect(pipelineKebabActions[1](PipelineRunModel, actionPipelineRuns[0]).label).toBe(
      'Start Last Run',
    );
  });
  it('expect Start Last Run option is not present', () => {
    const pipelineKebabActions = getPipelineKebabActions(undefined, false);
    expect(pipelineKebabActions.length).toBe(4);
    expect(pipelineKebabActions[1](PipelineRunModel, actionPipelineRuns[0]).label).not.toBe(
      'Start Last Run',
    );
  });
});
