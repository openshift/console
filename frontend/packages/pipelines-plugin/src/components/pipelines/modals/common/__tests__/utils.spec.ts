import { PipelineRun, Pipeline } from '../../../../../utils/pipeline-augment';
import { TektonResourceLabel } from '../../../const';
import {
  pipelineTestData,
  PipelineExampleNames,
  DataState,
} from '../../../../../test-data/pipeline-data';
import {
  convertPipelineToModalData,
  getPipelineRunData,
  getPipelineRunFromForm,
  migratePipelineRun,
} from '../utils';
import { CommonPipelineModalFormikValues } from '../types';

const samplePipeline = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline;
const samplePipelineRun =
  pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];

const pipelineRunData = (pipeline: Pipeline): PipelineRun => ({
  apiVersion: pipeline.apiVersion,
  kind: 'PipelineRun',
  metadata: {
    namespace: pipeline.metadata.namespace,
    name: expect.stringMatching(new RegExp(`${pipeline.metadata.name}-[a-z0-9]{6}`)),
    labels: { [TektonResourceLabel.pipeline]: pipeline.metadata.name },
  },
  spec: {
    pipelineRef: { name: pipeline.metadata.name },
  },
});

describe('PipelineAction testing getPipelineRunData', () => {
  it('expect null to be returned when no arguments are passed', () => {
    const runData = getPipelineRunData();
    expect(runData).toBeNull();
  });

  it('expect pipeline run data to be returned when only Pipeline argument is passed', () => {
    const runData = getPipelineRunData(samplePipeline);
    expect(runData).toMatchObject(pipelineRunData(samplePipeline));
  });

  it('expect pipeline run data to be returned when only PipelineRun argument is passed', () => {
    const runData = getPipelineRunData(null, samplePipelineRun);
    expect(runData).toMatchObject(pipelineRunData(samplePipeline));
  });

  it('expect pipeline run data with generateName if options argument is requests this', () => {
    const runData = getPipelineRunData(samplePipeline, null, { generateName: true });
    expect(runData).toMatchObject({
      ...pipelineRunData(samplePipeline),
      metadata: { generateName: `${samplePipeline.metadata.name}-` },
    });
  });
});

describe('PipelineAction testing getPipelineRunFromForm', () => {
  it('expect pipeline run data to have a name by default', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: 'corazon',
      parameters: [],
      resources: [],
      workspaces: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(samplePipeline, formValues, labels);
    expect(runData).toMatchObject(pipelineRunData(samplePipeline));
  });

  it('expect pipeline run data to have a generateName if generator option is true', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: samplePipeline.metadata.namespace,
      parameters: [],
      resources: [],
      workspaces: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(samplePipeline, formValues, labels, null, {
      generateName: true,
    });
    const pipelinerun = pipelineRunData(samplePipeline);
    expect(runData).toEqual({
      ...pipelinerun,
      metadata: {
        namespace: pipelinerun.metadata.namespace,
        generateName: `${samplePipeline.metadata.name}-`,
        labels: { ...pipelinerun.metadata.labels, ...labels },
        annotations: {},
      },
      spec: {
        pipelineRef: { name: samplePipeline.metadata.name },
        params: [],
        resources: [],
        status: null,
        workspaces: [],
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
      workspaces: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(samplePipeline, formValues, labels);

    const pipelinerun = getPipelineRunData(samplePipeline);
    expect(runData).toMatchObject({
      ...pipelinerun,
      metadata: { annotations: {}, labels },
      spec: {
        pipelineRef: { name: samplePipeline.metadata.name },
        params: [
          {
            name: 'ParameterA',
            value: 'Default value',
          },
        ],
        resources: [],
        status: null,
        workspaces: [],
      },
    });
  });

  it('expect pipeline run data to have a resources if the form data contains resources', () => {
    const formValues: CommonPipelineModalFormikValues = {
      namespace: 'corazon',
      parameters: [],
      resources: [
        {
          name: 'ResourceA',
          selection: 'SelectionA',
          data: {
            type: 'Git',
            params: {},
            secrets: {},
          },
        },
      ],
      workspaces: [],
    };
    const labels: { [key: string]: string } = {
      anotherlabel: 'another-label-value',
    };

    const runData = getPipelineRunFromForm(samplePipeline, formValues, labels);

    const pipelinerun = getPipelineRunData(samplePipeline);
    expect(runData).toMatchObject({
      ...pipelinerun,
      metadata: { annotations: {}, labels },
      spec: {
        pipelineRef: { name: samplePipeline.metadata.name },
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
        workspaces: [],
      },
    });
  });
});

describe('PipelineAction testing migratePipelineRun', () => {
  it('expect migratePipelineRun to do nothing when there is no migration needed', () => {
    // Same instance should be returned if there was no need for a migration
    expect(migratePipelineRun(samplePipelineRun)).toEqual(samplePipelineRun);
  });

  it('expect migratePipelineRun to handle serviceAccount to serviceAccountName migration (Operator 0.9.x)', () => {
    type OldPipelineRun = PipelineRun & {
      spec: {
        serviceAccount: string;
      };
    };
    const serviceAccountValue = 'serviceAccountValue';
    const plr: OldPipelineRun = {
      ...samplePipelineRun,
      spec: {
        ...samplePipelineRun.spec,
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
    expect(result.spec.pipelineRef).toEqual(samplePipelineRun.spec.pipelineRef);
  });
});

describe('convertPipelineToModalData', () => {
  const workspacePipeline = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE].pipeline;
  it('expect to return workspaces', () => {
    expect(convertPipelineToModalData(workspacePipeline).workspaces).toHaveLength(3);
  });

  it('expect to return workspaces with type EmptyDirectory, if preselect PVC argument is not passed', () => {
    const { workspaces } = convertPipelineToModalData(workspacePipeline);
    expect(workspaces.filter((workspace) => workspace.type === 'EmptyDirectory')).toHaveLength(3);
  });

  it('expect to return workspaces with type PVC, if preselect PVC argument is passed', () => {
    const { workspaces } = convertPipelineToModalData(workspacePipeline, false, 'test-pvc');
    expect(workspaces.filter((workspace) => workspace.type === 'EmptyDirectory')).toHaveLength(0);
    expect(workspaces.filter((workspace) => workspace.type === 'PVC')).toHaveLength(3);
  });
});
