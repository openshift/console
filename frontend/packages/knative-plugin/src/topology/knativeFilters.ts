import { Model } from '@console/topology/src/types';
import {
  DisplayFilters,
  getFilterById,
  TopologyDisplayFilterType,
} from '@console/dev-console/src/components/topology';
import { TYPE_EVENT_SOURCE, TYPE_KNATIVE_SERVICE } from './const';

export const SHOW_EVENT_SOURCE_FILTER_ID = 'eventSources';
export const EXPAND_KNATIVE_SERVICES_FILTER_ID = 'knativeServices';

export const getTopologyFilters = () => {
  return [
    {
      type: TopologyDisplayFilterType.show,
      id: SHOW_EVENT_SOURCE_FILTER_ID,
      label: 'Event Sources',
      priority: 200,
      value: true,
    },
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
  const showEventSources = getFilterById(SHOW_EVENT_SOURCE_FILTER_ID, filters)?.value ?? true;
  const expandServices = getFilterById(EXPAND_KNATIVE_SERVICES_FILTER_ID, filters)?.value ?? true;
  const appliedFilters = [];
  let sourceFound = false;
  let serviceFound = false;
  model.nodes.forEach((d) => {
    if (d.type === TYPE_EVENT_SOURCE) {
      if (!sourceFound) {
        sourceFound = true;
        appliedFilters.push(SHOW_EVENT_SOURCE_FILTER_ID);
      }
      d.visible = showEventSources;
    }
    if (d.type === TYPE_KNATIVE_SERVICE) {
      if (!serviceFound) {
        serviceFound = true;
        appliedFilters.push(EXPAND_KNATIVE_SERVICES_FILTER_ID);
      }
      d.collapsed = !expandServices;
    }
  });
  return appliedFilters;
};

export const applyDisplayOptions = () => applyKnativeDisplayOptions;
