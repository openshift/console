import * as _ from 'lodash';
import { TektonParam } from '../../../types';

export const removeEmptyDefaultFromPipelineParams = (parameters: TektonParam[]): TektonParam[] =>
  _.map(
    parameters,
    (parameter) =>
      _.omit(parameter, _.isEmpty(parameter.default) ? ['default'] : []) as TektonParam,
  );
