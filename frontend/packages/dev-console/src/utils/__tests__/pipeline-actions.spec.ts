import { stopPipelineRun, rerunPipeline } from '../pipeline-actions';

import { PipelineRun, Pipeline } from '../pipeline-augment';
import { PipelineModel, PipelineRunModel } from '../../models';

export const actionPipelines: Pipeline[] = [
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'sansa-stark', namespace: 'corazon' },
  },
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'danaerys-targaeryen', namespace: 'corazon' },
  },
];

export const actionPipelineRuns: PipelineRun[] = [
  {
    apiVersion: 'abhiapi/v1',
    kind: 'PipelineRun',
    metadata: { name: 'winterfell', namespace: 'corazon' },
    status: { creationTimestamp: '31', conditions: [{ type: 'Succeeded', status: 'True' }] },
  },
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'dragonstone', namespace: 'corazon' },
    status: { creationTimestamp: '31', conditions: [{ type: 'Succeeded', status: 'Unknown' }] },
  },
];

describe('PipelineAction testing rerunPipeline create correct labels and callbacks', () => {
  it('expect label to be "Trigger Last Run" when latestRun is available', () => {
    const rerunAction = rerunPipeline(actionPipelines[0], actionPipelineRuns[0]);
    const rerunResult = rerunAction(PipelineModel, actionPipelines[1]);
    expect(rerunResult.label).toBe('Trigger Last Run');
    expect(rerunResult.callback).not.toBeNull();
  });
  it('expect label not to be "Trigger" when latestRun is unavailable', () => {
    const rerunAction = rerunPipeline(actionPipelines[1], null);
    const rerunResult = rerunAction(PipelineModel, actionPipelines[1]);
    expect(rerunResult.label).not.toBe('Trigger Last Run');
    expect(rerunResult.callback).toBeNull();
  });
});

describe('PipelineAction testing stopPipelineRun create correct labels and callbacks', () => {
  it('expect label to be "Stop Pipeline Run" when latest Run is running', () => {
    const stopAction = stopPipelineRun(actionPipelineRuns[1]);
    const stopResult = stopAction(PipelineRunModel, actionPipelineRuns[1]);
    expect(stopResult.label).toBe('Stop Pipeline Run');
    expect(stopResult.callback).not.toBeNull();
  });
  it('expect label not to be "Stop Pipeline Run" when latestRun is not running', () => {
    const stopAction = stopPipelineRun(actionPipelineRuns[0]);
    const stopResult = stopAction(PipelineRunModel, actionPipelineRuns[0]);
    expect(stopResult.label).not.toBe('Stop Pipeline Run');
    expect(stopResult.callback).toBeNull();
  });
});
