import { Model } from '@patternfly/react-topology';
import { TYPE_HELM_RELEASE } from './components/const';
import { TopologyDisplayFilterType, DisplayFilters } from '../topology-types';
import { isExpanded } from '../filters';

export const EXPAND_HELM_RELEASE_FILTER = 'helmGrouping';

export const getTopologyFilters = () => {
  return [
    {
      type: TopologyDisplayFilterType.expand,
      id: EXPAND_HELM_RELEASE_FILTER,
      label: 'Helm Releases',
      priority: 300,
      value: true,
    },
  ];
};

export const applyHelmDisplayOptions = (model: Model, filters: DisplayFilters): string[] => {
  let found = false;
  const appliedFilters = [];
  const expanded = isExpanded(EXPAND_HELM_RELEASE_FILTER, filters);
  model.nodes.forEach((d) => {
    if (d.type === TYPE_HELM_RELEASE) {
      if (!found) {
        found = true;
        appliedFilters.push(EXPAND_HELM_RELEASE_FILTER);
      }
      d.collapsed = !expanded;
    }
  });
  return appliedFilters;
};

export const applyDisplayOptions = () => applyHelmDisplayOptions;
