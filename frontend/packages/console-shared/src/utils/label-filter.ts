import * as _ from 'lodash';
import { toRequirements, requirementToString } from '@console/dynamic-plugin-sdk/src/utils/k8s';

export const getLabelsAsString = (obj: any, path: string = 'metadata.labels'): string[] => {
  const labels = _.get(obj, path);
  const requirements = toRequirements(labels);
  return _.map(requirements, requirementToString);
};
