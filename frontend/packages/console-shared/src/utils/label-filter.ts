import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { toRequirements } from '@console/internal/module/k8s/selector';
import { requirementToString } from '@console/internal/module/k8s/selector-requirement';

export const getLabelsAsString = (obj: K8sResourceCommon): string[] => {
  const { labels } = obj.metadata;
  const requirements = toRequirements(labels);
  return _.map(requirements, requirementToString);
};
