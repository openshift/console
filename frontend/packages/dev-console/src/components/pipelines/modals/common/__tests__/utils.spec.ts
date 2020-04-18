import * as _ from 'lodash';
import { PipelineRun, Pipeline } from '../../../../../utils/pipeline-augment';
import { getPipelineRunData, migratePipelineRun } from '../utils';

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

describe('PipelineAction testing getPipelineRunData', () => {
  it('expect null to be returned when no arguments are passed', () => {
    const runData = getPipelineRunData();
    expect(runData).toBeNull();
  });

  it('expect pipeline run data to be returned when only Pipeline argument is passed', () => {
    const runData = getPipelineRunData(actionPipelines[0]);
    expect(runData).not.toBeNull();
  });

  it('expect pipeline run data to be returned when only PipelineRun argument is passed', () => {
    const runData = getPipelineRunData(null, actionPipelineRuns[0]);
    expect(runData).not.toBeNull();
  });

  it('expect params to not have default key in the pipeline run data', () => {
    const runData = getPipelineRunData(actionPipelines[0]);
    const { params } = runData.spec;
    expect(params[0].name).toBe('APP_NAME');
    expect(params[0].value).toBe('default-app-name');
    expect(_.has(params[0], 'default')).toBeFalsy();
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
