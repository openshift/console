import { Model } from '@patternfly/react-topology';
import { isExpanded } from '@console/topology/src/filters';
import { DisplayFilters, TopologyDisplayFilterType } from '@console/topology/src/topology-types';
import { TYPE_KNATIVE_SERVICE } from './const';

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
  });
  return appliedFilters;
};
