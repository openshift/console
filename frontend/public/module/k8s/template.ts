import * as _ from 'lodash-es';

import { TemplateInstanceKind } from './types';

export const getTemplateInstanceStatus = (instance: TemplateInstanceKind) => {
  const conditions = _.get(instance, 'status.conditions');
  const failed = _.some(conditions, { type: 'InstantiateFailure', status: 'True' });
  if (failed) {
    return 'Failed';
  }
  const ready = _.some(conditions, { type: 'Ready', status: 'True' });
  return ready ? 'Ready' : 'Not Ready';
};
