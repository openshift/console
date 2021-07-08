import { Model } from '@patternfly/react-topology';
import { isExpanded } from '../filters';
import { TopologyDisplayFilterType, DisplayFilters } from '../topology-types';
import { TYPE_OPERATOR_BACKED_SERVICE } from './components/const';

export const EXPAND_OPERATORS_RELEASE_FILTER = 'operatorGrouping';

export const getTopologyFilters = () => {
  return [
    {
      type: TopologyDisplayFilterType.expand,
      id: EXPAND_OPERATORS_RELEASE_FILTER,
      // t('topology~Operator groupings')
      labelKey: 'topology~Operator groupings',
      priority: 500,
      value: true,
    },
  ];
};

export const applyOperatorDisplayOptions = (model: Model, filters: DisplayFilters): string[] => {
  let found = false;
  const appliedFilters = [];
  const expanded = isExpanded(EXPAND_OPERATORS_RELEASE_FILTER, filters);
  model.nodes.forEach((d) => {
    if (d.type === TYPE_OPERATOR_BACKED_SERVICE) {
      if (!found) {
        found = true;
        appliedFilters.push(EXPAND_OPERATORS_RELEASE_FILTER);
      }
      d.collapsed = !expanded;
    }
  });
  return appliedFilters;
};

export const applyDisplayOptions = () => applyOperatorDisplayOptions;
