import * as _ from 'lodash';
import { toRequirements } from '@console/internal/module/k8s/selector';
import { requirementToString } from '@console/internal/module/k8s/selector-requirement';

export const getLabelsAsString = (obj: any, path: string = 'metadata.labels'): string[] => {
  const labels = _.get(obj, path);
  const requirements = toRequirements(labels);
  return _.map(requirements, requirementToString);
};
