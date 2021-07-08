import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../../test-data/pipeline-data';
import { PipelineKind, PipelineRunKind } from '../../../../../types';
import { preferredNameAnnotation, TektonResourceLabel, VolumeTypes } from '../../../const';
import { CommonPipelineModalFormikValues } from '../types';
import {
  convertPipelineToModalData,
  getPipelineName,
  getPipelineRunData,
  getPipelineRunFromForm,
  migratePipelineRun,
} from '../utils';

const samplePipeline = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline;
const samplePipelineRun =
  pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];

const pipelineRunData = (pipeline: PipelineKind): PipelineRunKind => ({
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

describe('PipelineAction testing migratePipelineRun', () => {
  it('expect migratePipelineRun to do nothing when there is no migration needed', () => {
    // Same instance should be returned if there was no need for a migration
    expect(migratePipelineRun(samplePipelineRun)).toEqual(samplePipelineRun);
  });

  it('expect migratePipelineRun to handle serviceAccount to serviceAccountName migration (Operator 0.9.x)', () => {
    type OldPipelineRun = PipelineRunKind & {
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

    const result: PipelineRunKind = migratePipelineRun(plr);

    // Should be a new instance
    expect(result).not.toEqual(plr);

    // The value should have moved
    expect(result.spec.serviceAccountName).toEqual(serviceAccountValue);
    expect((result as OldPipelineRun).spec.serviceAccount).toBeUndefined();

    // Should still have other spec properties
    expect(result.spec.pipelineRef).toEqual(samplePipelineRun.spec.pipelineRef);
  });
});

describe('getPipelineName', () => {
  it('should return null if no argument is provided', () => {
    expect(getPipelineName()).toBeNull();
  });

  it('should return the name from the pipeline metadata if both pipeline and latestRun are provided', () => {
    expect(getPipelineName(samplePipeline, samplePipelineRun)).toEqual(
      samplePipeline.metadata.name,
    );
  });

  it('should return the name from the pipeline metadata if only pipeline is provided', () => {
    expect(getPipelineName(samplePipeline)).toEqual(samplePipeline.metadata.name);
  });

  it('should return the name from the pipelineRef, if only latestRun is provided and pipelineRef exists', () => {
    const pipelineRunWithPipelineRef =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[DataState.SKIPPED];
    expect(getPipelineName(undefined, pipelineRunWithPipelineRef)).toEqual(
      pipelineRunWithPipelineRef.spec.pipelineRef.name,
    );
  });

  it('should return the name from the latestRun metadata, if only latestRun is provided and annotation does not include the name', () => {
    const pipelineRunWithPipelineSpec =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[
        DataState.IN_PROGRESS
      ];
    expect(getPipelineName(undefined, pipelineRunWithPipelineSpec)).toEqual(
      pipelineRunWithPipelineSpec.metadata.name,
    );
  });

  it('should return the name from the annotations, if only latestRun is provided and annotation includes the name', () => {
    const pipelineRunWithAnnotations =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[DataState.SUCCESS];
    expect(getPipelineName(undefined, pipelineRunWithAnnotations)).toEqual(
      pipelineRunWithAnnotations.metadata.annotations?.[preferredNameAnnotation],
    );
  });
});

describe('PipelineAction testing getPipelineRunData', () => {
  it('expect null to be returned when no arguments are passed', () => {
    // Suppress the error log when we don't have pipeline or pipeline run
    jest.spyOn(console, 'error').mockImplementation(jest.fn());

    const runData = getPipelineRunData();
    expect(runData).toBeNull();

    // eslint-disable-next-line no-console
    (console.error as any).mockRestore();
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

  it('should set the annotation for preferredName if the latestRun have neither this annotation nor pipelineRef', () => {
    const pipelineRun =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[
        DataState.IN_PROGRESS
      ];
    const runData = getPipelineRunData(null, pipelineRun);
    expect(runData.metadata.annotations).toMatchObject({
      [preferredNameAnnotation]: pipelineRun.metadata.name,
    });
  });

  it('should not set the label for pipeline name if pipeline is not passed and latestRun does not have a pipelineRef', () => {
    const pipelineRun =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[
        DataState.IN_PROGRESS
      ];
    const runData = getPipelineRunData(null, pipelineRun);
    expect(runData.metadata.labels?.[TektonResourceLabel.pipeline]).toBeUndefined();
  });

  it('should set the label for pipeline name if pipeline is passed', () => {
    const runData = getPipelineRunData(samplePipeline);
    expect(runData.metadata.labels).toMatchObject({
      [TektonResourceLabel.pipeline]: samplePipeline.metadata.name,
    });
  });

  it('should set the label for pipeline name if only latestRun is passed and latestRun has a pipelineRef', () => {
    const pipelineRun =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[DataState.SKIPPED];
    const runData = getPipelineRunData(null, pipelineRun);
    expect(runData.metadata.labels).toMatchObject({
      [TektonResourceLabel.pipeline]: pipelineRun.spec.pipelineRef.name,
    });
  });

  it('should not set pipelineRef in the spec if pipeline is not passed and latestRun does not have a pipelineRef', () => {
    const pipelineRun =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[
        DataState.IN_PROGRESS
      ];
    const runData = getPipelineRunData(null, pipelineRun);
    expect(runData.spec.pipelineRef).toBeUndefined();
  });

  it('should set pipelineRef in the spec if pipeline is passed', () => {
    const runData = getPipelineRunData(samplePipeline);
    expect(runData.spec.pipelineRef).toMatchObject(samplePipelineRun.spec.pipelineRef);
  });

  it('should set pipelineRef in the spec if only latestRun is passed and latestRun has a pipelineRef', () => {
    const pipelineRun =
      pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[DataState.SKIPPED];
    const runData = getPipelineRunData(null, pipelineRun);
    expect(runData.spec.pipelineRef).toMatchObject(pipelineRun.spec.pipelineRef);
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
          value: 'Updated value',
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
            value: 'Updated value',
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

describe('convertPipelineToModalData', () => {
  const workspacePipeline = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE].pipeline;
  it('expect to return workspaces', () => {
    expect(convertPipelineToModalData(workspacePipeline).workspaces).toHaveLength(3);
  });

  it('expect to return workspaces with type EmptyDirectory, if preselect PVC argument is not passed', () => {
    const { workspaces } = convertPipelineToModalData(workspacePipeline);
    expect(
      workspaces.filter((workspace) => workspace.type === VolumeTypes.EmptyDirectory),
    ).toHaveLength(2);
    expect(
      workspaces.filter((workspace) => workspace.type === VolumeTypes.NoWorkspace),
    ).toHaveLength(1);
  });

  it('expect to return workspaces with type PVC, if preselect PVC argument is passed', () => {
    const { workspaces } = convertPipelineToModalData(workspacePipeline, false, 'test-pvc');
    expect(
      workspaces.filter((workspace) => workspace.type === VolumeTypes.EmptyDirectory),
    ).toHaveLength(0);
    expect(workspaces.filter((workspace) => workspace.type === VolumeTypes.PVC)).toHaveLength(2);
    expect(
      workspaces.filter((workspace) => workspace.type === VolumeTypes.NoWorkspace),
    ).toHaveLength(1);
  });
});
