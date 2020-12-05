import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '@console/pipelines-plugin/src/test-data/pipeline-data';

export const connectedPipelineOne = {
  pipeline: pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline,
  pipelineRuns: [
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS],
    pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.IN_PROGRESS],
  ],
};
