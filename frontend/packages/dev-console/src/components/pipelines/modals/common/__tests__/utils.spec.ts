import { PipelineRun, Pipeline } from '../../../../../utils/pipeline-augment';
import { getPipelineRunData, getPipelineRunFromForm, migratePipelineRun } from '../utils';
import { CommonPipelineModalFormikValues } from '../types';

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
    expect(runData).toMatchObject({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        namespace: 'corazon',
        name: expect.stringMatching(/sansa-stark-[a-z0-9]{6}/),
        labels: { 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: {
        pipelineRef: { name: 'sansa-stark' },
      },
    });
  });

  it('expect pipeline run data to be returned when only PipelineRun argument is passed', () => {
    const runData = getPipelineRunData(null, actionPipelineRuns[0]);
    expect(runData).toMatchObject({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        namespace: 'corazon',
        name: expect.stringMatching(/sansa-stark-[a-z0-9]{6}/),
        labels: { 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: { pipelineRef: { name: 'sansa-stark' } },
    });
  });

  it('expect pipeline run data with generateName if options argument is requests this', () => {
    const runData = getPipelineRunData(actionPipelines[0], null, { generateName: true });
    expect(runData).toMatchObject({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        namespace: 'corazon',
        generateName: 'sansa-stark-',
        labels: { 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: { pipelineRef: { name: 'sansa-stark' } },
    });
  });
});

describe('PipelineAction testing getPipelineRunFromForm', () => {
  it('expect pipeline run data to have a name by default', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: 'corazon',
      parameters: [],
      resources: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(actionPipelines[0], formValues, labels);
    expect(runData).toMatchObject({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        namespace: 'corazon',
        name: expect.stringMatching(/sansa-stark-[a-z0-9]{6}/),
        labels: { 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: { pipelineRef: { name: 'sansa-stark' } },
    });
  });

  it('expect pipeline run data to have a generateName if generator option is true', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: 'corazon',
      parameters: [],
      resources: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(actionPipelines[0], formValues, labels, null, {
      generateName: true,
    });
    expect(runData).toEqual({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        annotations: {},
        namespace: 'corazon',
        generateName: 'sansa-stark-',
        labels: { ...labels, 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: {
        pipelineRef: { name: 'sansa-stark' },
        params: [],
        resources: [],
        status: null,
        workspaces: undefined,
      },
    });
  });

  it('expect pipeline run data to have a parameters if the form data contains parameters', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: 'corazon',
      parameters: [
        {
          name: 'ParameterA',
          default: 'Default value',
          description: 'Description',
        },
      ],
      resources: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(actionPipelines[0], formValues, labels);
    expect(runData).toMatchObject({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        namespace: 'corazon',
        name: expect.stringMatching(/sansa-stark-[a-z0-9]{6}/),
        labels: { ...labels, 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: {
        pipelineRef: { name: 'sansa-stark' },
        params: [
          {
            name: 'ParameterA',
            value: 'Default value',
          },
        ],
        resources: [],
        status: null,
        workspaces: undefined,
      },
    });
  });

  it('expect pipeline run data to have a resources if the form data contains resources', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: 'corazon',
      parameters: [],
      resources: [
        {
          pipelineName: 'PipelineA',
          name: 'ResourceA',
          selection: 'SelectionA',
          data: {
            type: 'Git',
            params: {},
            secrets: {},
          },
        },
      ],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(actionPipelines[0], formValues, labels);
    expect(runData).toMatchObject({
      apiVersion: 'abhiapi/v1',
      kind: 'PipelineRun',
      metadata: {
        namespace: 'corazon',
        name: expect.stringMatching(/sansa-stark-[a-z0-9]{6}/),
        labels: { ...labels, 'tekton.dev/pipeline': 'sansa-stark' },
      },
      spec: {
        pipelineRef: { name: 'sansa-stark' },
        params: [],
        resources: [
          {
            name: 'ResourceA',
            resourceRef: {
              name: 'SelectionA',
            },
          },
        ],
        status: null,
        workspaces: undefined,
      },
    });
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
