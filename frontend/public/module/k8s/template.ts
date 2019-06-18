import * as _ from 'lodash';

import { TemplateInstanceKind } from '../../module/k8s';

export const getTemplateInstanceStatus = (instance: TemplateInstanceKind) => {
  const conditions = _.get(instance, 'status.conditions');
  const failed = _.some(conditions, { type: 'InstantiateFailure', status: 'True' });
  if (failed) {
    return 'Failed';
  }
  const ready = _.some(conditions, { type: 'Ready', status: 'True' });
  return ready ? 'Ready' : 'Not Ready';
};
