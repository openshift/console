import { PipelineParam } from '@console/dev-console/src/utils/pipeline-augment';

export const pipelineParameters: PipelineParam[] = [
  {
    name: 'param1',
    default: 'abc',
    description: 'This is param 1',
  },
  {
    name: 'param2',
    default: '',
    description: 'This is param 2',
  },
  {
    name: 'param3',
    default: 'xyz',
    description: 'This is param 3',
  },
];

export const pipelineParametersWithoutDefaults: PipelineParam[] = [
  {
    name: 'param1',
    description: 'This is param 1',
  },
  {
    name: 'param2',
    description: 'This is param 2',
  },
  {
    name: 'param3',
    description: 'This is param 3',
  },
];
