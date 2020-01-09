import { stopPipelineRun, rerunPipeline, migratePipelineRun } from '../pipeline-actions';
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
    spec: {
      pipelineRef: {
        name: 'dragonstone',
      },
    },
  },
  {
    apiVersion: 'abhiapi/v1',
    kind: 'Pipeline',
    metadata: { name: 'dragonstone', namespace: 'corazon' },
    status: { creationTimestamp: '31', conditions: [{ type: 'Succeeded', status: 'Unknown' }] },
  },
];

describe('PipelineAction testing rerunPipeline create correct labels and callbacks', () => {
  it('expect label to be "Start Last Run" when latestRun is available', () => {
    const rerunAction = rerunPipeline(actionPipelines[0], actionPipelineRuns[0]);
    const rerunResult = rerunAction(PipelineModel, actionPipelines[1]);
    expect(rerunResult.label).toBe('Start Last Run');
    expect(rerunResult.callback).not.toBeNull();
  });
  it('expect label not to be "Start Last Run" when latestRun is unavailable', () => {
    const rerunAction = rerunPipeline(actionPipelines[1], null);
    const rerunResult = rerunAction(PipelineModel, actionPipelines[1]);
    expect(rerunResult.label).not.toBe('Start Last Run');
    expect(rerunResult.callback).toBeNull();
  });
});

describe('PipelineAction testing stopPipelineRun create correct labels and callbacks', () => {
  it('expect label to be "Stop" when latest Run is running', () => {
    const stopAction = stopPipelineRun(actionPipelineRuns[1]);
    const stopResult = stopAction(PipelineRunModel, actionPipelineRuns[1]);
    expect(stopResult.label).toBe('Stop');
    expect(stopResult.callback).not.toBeNull();
  });
  it('expect label not to be "Stop" when latestRun is not running', () => {
    const stopAction = stopPipelineRun(actionPipelineRuns[0]);
    const stopResult = stopAction(PipelineRunModel, actionPipelineRuns[0]);
    expect(stopResult.label).not.toBe('Stop');
    expect(stopResult.callback).toBeNull();
  });
});

describe('PipelineAction testing migratePipelineRun', () => {
  it('expect migratePipelineRun to do nothing when there is no migration needed', () => {
    // Same instance should be returned if there was no need for a migration
    expect(migratePipelineRun(actionPipelineRuns[0])).toEqual(actionPipelineRuns[0]);
  });

  it('expect migratePipelineRun to handle serviceAccount to serviceAccountName migration (Operator 0.9.x)', () => {
    type OldPipelineRun = PipelineRun & {
      spec: {
        serviceAccount: string;
      };
    };
    const serviceAccountValue = 'serviceAccountValue';
    const plr: OldPipelineRun = {
      ...actionPipelineRuns[0],
      spec: {
        ...actionPipelineRuns[0].spec,
        serviceAccount: serviceAccountValue,
      },
    };

    const result: PipelineRun = migratePipelineRun(plr);

    // Should be a new instance
    expect(result).not.toEqual(plr);

    // The value should have moved
    expect(result.spec.serviceAccountName).toEqual(serviceAccountValue);
    expect((result as OldPipelineRun).spec.serviceAccount).toBeUndefined();

    // Should still have other spec properties
    expect(result.spec.pipelineRef).toEqual(actionPipelineRuns[0].spec.pipelineRef);
  });
});
