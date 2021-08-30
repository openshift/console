import { Model } from '@patternfly/react-topology';
import { getFilterById, isExpanded, SHOW_GROUPS_FILTER_ID } from '@console/topology/src/filters';
import { DisplayFilters, TopologyDisplayFilterType } from '@console/topology/src/topology-types';
import {
  TYPE_EVENT_SOURCE,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_SINK_URI,
  TYPE_EVENT_PUB_SUB,
  TYPE_EVENT_SOURCE_KAFKA,
} from './const';

const KNATIVE_NON_CONSUMPTION_TYPES = [
  TYPE_EVENT_SOURCE_KAFKA,
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
      // t('knative-plugin~Knative Services')
      labelKey: 'knative-plugin~Knative Services',
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
