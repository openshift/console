import { pluralize } from '@console/internal/components/utils';
import { AffinityRowData } from '../affinity-modal/types';

// Node Checker
const pluralNode = (size) => pluralize(size, 'node', 'nodes', false);
export const SCHEDULING_NODES_MATCH_TEXT = (nodeAmount) =>
  `${nodeAmount} matching ${pluralNode(nodeAmount)} found for the labels mentioned above`;
export const SCHEDULING_NODES_MATCH_BUTTON_TEXT = (nodeAmount) =>
  `View ${nodeAmount} matching ${pluralNode(nodeAmount)}`;
export const SCHEDULING_NO_NODES_MATCH_BUTTON_TEXT =
  'Scheduling will not be possible at this state';
export const SCHEDULING_NO_NODES_MATCH_TEXT = 'No matching nodes found for the labels';

// Node Selector
export const NODE_SELECTOR_MODAL_TITLE = 'Node Selector';

// Dedicated Resources
export const DEDICATED_RESOURCES_LABELS = [{ id: null, key: 'cpumanager', value: 'true' }];
export const DEDICATED_RESOURCES_MODAL_TITLE = 'Dedicated Resources';
export const DEDICATED_RESOURCES_NOT_PINNED = 'No Dedicated resources applied';
export const DEDICATED_RESOURCES_PINNED =
  'Workload scheduled with dedicated resources (guaranteed policy)';

// Tolerations Modal
export const TOLERATIONS_MODAL_TITLE = 'Tolerations';
export const TOLERATIONS_EFFECTS = ['NoSchedule', 'PreferNoSchedule', 'NoExecute'];

// Affinity Modal
export const AFFINITY_MODAL_TITLE = 'Affinity Rules';
export const AFFINITY_CREATE = 'New Affinity';
export const AFFINITY_EDITING = 'Edit Affinity';

export const AFFINITY_CONDITION_LABELS = {
  preferredDuringSchedulingIgnoredDuringExecution: 'Preferred',
  requiredDuringSchedulingIgnoredDuringExecution: 'Required',
};

export const AFFINITY_CONDITIONS = {
  preferred: 'preferredDuringSchedulingIgnoredDuringExecution' as AffinityRowData['condition'],
  required: 'requiredDuringSchedulingIgnoredDuringExecution' as AffinityRowData['condition'],
};

export const AFFINITY_TYPE_LABLES = {
  nodeAffinity: 'Node Affinity',
  podAffinity: 'Workload (pod) Affinity',
  podAntiAffinity: 'Workload (pod) Anti-Affinity',
};

export const EXPRESSION_OPERATORS = ['In', 'NotIn', 'Exists', 'DoesNotExist'];
