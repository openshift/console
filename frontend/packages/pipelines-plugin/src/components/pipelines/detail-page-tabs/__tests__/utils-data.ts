import { TektonParam } from '../../../../types';

export const pipelineParameters: TektonParam[] = [
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

export const pipelineParametersWithoutDefaults: TektonParam[] = [
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
