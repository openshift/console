import * as _ from 'lodash';
import { PipelineParam } from '@console/dev-console/src/utils/pipeline-augment';

export const removeEmptyDefaultFromPipelineParams = (
  parameters: PipelineParam[],
): PipelineParam[] =>
  _.map(
    parameters,
    (parameter) =>
      _.omit(parameter, _.isEmpty(parameter.default) ? ['default'] : []) as PipelineParam,
  );
