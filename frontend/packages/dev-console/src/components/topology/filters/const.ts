import { TopologyDisplayFilterType } from '../topology-types';

export const SHOW_POD_COUNT_FILTER_ID = 'show-pod-count';
export const SHOW_LABELS_FILTER_ID = 'show-labels';
export const EXPAND_APPLICATION_GROUPS_FILTER_ID = 'expand-app-groups';
export const DEFAULT_TOPOLOGY_FILTERS = [
  {
    type: TopologyDisplayFilterType.show,
    id: SHOW_POD_COUNT_FILTER_ID,
    label: 'Pod Count',
    priority: 10,
    value: false,
  },
  {
    type: TopologyDisplayFilterType.show,
    id: SHOW_LABELS_FILTER_ID,
    label: 'Labels',
    priority: 900,
    value: true,
  },
  {
    type: TopologyDisplayFilterType.expand,
    id: EXPAND_APPLICATION_GROUPS_FILTER_ID,
    label: 'Application Groupings',
    priority: 10,
    value: true,
  },
];

export const DEFAULT_SUPPORTED_FILTER_IDS = [SHOW_POD_COUNT_FILTER_ID, SHOW_LABELS_FILTER_ID];
