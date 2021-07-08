import * as _ from 'lodash';
import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import { TektonParam } from '../../../../types';
import { getPipelineTaskLinks, removeEmptyDefaultFromPipelineParams } from '../utils';
import { pipelineParameters, pipelineParametersWithoutDefaults } from './utils-data';

describe('removeEmptyDefaultFromPipelineParams omits empty default values', () => {
  it('should return pipline parameters by only omitting empty default values', () => {
    const result = removeEmptyDefaultFromPipelineParams(pipelineParameters);
    const expectedPipelineParameters: TektonParam[] = [
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

describe('getPipelineTaskLinks', () => {
  const { pipeline: simplePipeline } = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];
  const { pipeline: pipelineWithFinally } = pipelineTestData[
    PipelineExampleNames.PIPELINE_WITH_FINALLY
  ];
  const taskWithoutTaskRef = {
    tasks: [
      {
        name: 'task1',
        taskSpec: {
          metadata: {
            labels: {
              app: 'example',
            },
          },
          steps: [{ name: 'echo', image: 'ubuntu' }],
        },
      },
    ],
  };
  it('should return links for only regular tasks if there are regular tasks with taskRef but no finally tasks', () => {
    const { taskLinks, finallyTaskLinks } = getPipelineTaskLinks(simplePipeline);
    expect(taskLinks).toHaveLength(2);
    expect(finallyTaskLinks).toHaveLength(0);
  });
  it('should return links for finally tasks if there are finally tasks and no regular tasks with taskRef', () => {
    const pipelineWithoutTaskRef = {
      ...pipelineWithFinally,
      spec: { ...pipelineWithFinally.spec, tasks: taskWithoutTaskRef.tasks },
    };
    const { taskLinks, finallyTaskLinks } = getPipelineTaskLinks(pipelineWithoutTaskRef);
    expect(taskLinks).toHaveLength(1);
    expect(finallyTaskLinks).toHaveLength(1);
  });
  it('should return links for both regular tasks and finally tasks if both are present', () => {
    const { taskLinks, finallyTaskLinks } = getPipelineTaskLinks(pipelineWithFinally);
    expect(taskLinks).toHaveLength(2);
    expect(finallyTaskLinks).toHaveLength(1);
  });
});
