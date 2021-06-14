import { pluralize } from '@console/internal/components/utils';
import { AffinityCondition, AffinityType } from '../affinity-modal/types';

// Node Checker
const pluralNode = (size) => pluralize(size, 'node', 'nodes', false);
export const getSchedulingNodesMatchMsg = (nodeAmount) =>
  `${nodeAmount} matching ${pluralNode(nodeAmount)} found`;
export const getSchedulingWithPreferredNodesMatchMsg = (nodeAmount, preferredNodeAmount) =>
  `${nodeAmount} matching ${pluralNode(
    nodeAmount,
  )} found, ${preferredNodeAmount} matching preferred ${pluralNode(preferredNodeAmount)} found`;
export const getSchedulingNodesMatchButtonLabel = (nodeAmount) =>
  `View ${nodeAmount} matching ${pluralNode(nodeAmount)}`;

// Dedicated Resources
export const DEDICATED_RESOURCES_LABELS = [{ id: null, key: 'cpumanager', value: 'true' }];

// Tolerations Modal
export const TOLERATIONS_EFFECTS = ['NoSchedule', 'PreferNoSchedule', 'NoExecute'];

export const AFFINITY_CONDITION_LABELS = {
  [AffinityCondition.preferred]: 'Preferred during scheduling',
  [AffinityCondition.required]: 'Required during scheduling',
};

export const AFFINITY_TYPE_LABLES = {
  [AffinityType.node]: 'Node Affinity',
  [AffinityType.pod]: 'Workload (pod) Affinity',
  [AffinityType.podAnti]: 'Workload (pod) Anti-Affinity',
};

export const EXPRESSION_OPERATORS = ['In', 'NotIn', 'Exists', 'DoesNotExist'];
