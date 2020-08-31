import { Model } from '@patternfly/react-topology';
import {
  DisplayFilters,
  getFilterById,
  isExpanded,
  SHOW_GROUPS_FILTER_ID,
  TopologyDisplayFilterType,
} from '@console/dev-console/src/components/topology';
import {
  TYPE_EVENT_SOURCE,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_SINK_URI,
  TYPE_EVENT_PUB_SUB,
} from './const';

const KNATIVE_NON_CONSUMPTION_TYPES = [
  TYPE_EVENT_SOURCE,
  TYPE_KNATIVE_REVISION,
  TYPE_SINK_URI,
  TYPE_EVENT_PUB_SUB,
];

export const EXPAND_KNATIVE_SERVICES_FILTER_ID = 'knativeServices';

export const getTopologyFilters = () => {
  return [
    {
      type: TopologyDisplayFilterType.expand,
      id: EXPAND_KNATIVE_SERVICES_FILTER_ID,
      label: 'Knative Services',
      priority: 400,
      value: true,
    },
  ];
};

export const applyKnativeDisplayOptions = (model: Model, filters: DisplayFilters): string[] => {
  const expandServices = isExpanded(EXPAND_KNATIVE_SERVICES_FILTER_ID, filters);
  const groupsShown = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
  const appliedFilters = [];
  let serviceFound = false;
  model.nodes.forEach((d) => {
    if (d.type === TYPE_KNATIVE_SERVICE) {
      if (!serviceFound) {
        serviceFound = true;
        appliedFilters.push(EXPAND_KNATIVE_SERVICES_FILTER_ID);
      }
      d.collapsed = !expandServices;
    }
    if (!groupsShown && KNATIVE_NON_CONSUMPTION_TYPES.includes(d.type)) {
      d.visible = false;
    }
  });
  return appliedFilters;
};

export const applyDisplayOptions = () => applyKnativeDisplayOptions;
