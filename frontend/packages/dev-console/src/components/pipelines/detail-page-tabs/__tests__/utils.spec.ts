import * as _ from 'lodash';
import { PipelineParam } from '@console/dev-console/src/utils/pipeline-augment';
import { pipelineParameters, pipelineParametersWithoutDefaults } from './utils-data';
import { removeEmptyDefaultFromPipelineParams } from '../utils';

describe('removeEmptyDefaultFromPipelineParams omits empty default values', () => {
  it('should return pipline parameters by only omitting empty default values', () => {
    const result = removeEmptyDefaultFromPipelineParams(pipelineParameters);
    const expectedPipelineParameters: PipelineParam[] = [
      {
        name: 'param1',
        default: 'abc',
        description: 'This is param 1',
      },
      {
        name: 'param2',
        description: 'This is param 2',
      },
      {
        name: 'param3',
        default: 'xyz',
        description: 'This is param 3',
      },
    ];

    expect(result).toEqual(expectedPipelineParameters);
  });

  it('should return empty array if pipline parameters is empty', () => {
    let result = removeEmptyDefaultFromPipelineParams(null);
    expect(result).toEqual([]);

    result = removeEmptyDefaultFromPipelineParams([]);
    expect(result).toEqual([]);
  });

  it('should return pipline parameters as is if default is non-empty', () => {
    const pipelineParams = _.cloneDeep(pipelineParameters);
    pipelineParams[1].default = 'mno';
    const result = removeEmptyDefaultFromPipelineParams(pipelineParams);
    expect(result).toEqual(pipelineParams);
  });

  it('should return pipline parameters as is if the default property is not present', () => {
    const result = removeEmptyDefaultFromPipelineParams(pipelineParametersWithoutDefaults);
    expect(result).toEqual(pipelineParametersWithoutDefaults);
  });
});
