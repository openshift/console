import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { Board, MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY } from './types';
import { getQueryArgument } from '../../utils';

export const getAllVariables = (boards: Board[], newBoardName: string, namespace: string) => {
  const data = _.find(boards, { name: newBoardName })?.data;

  const allVariables = {};
  _.each(data?.templating?.list, (v) => {
    if (v.type === 'query' || v.type === 'interval') {
      // Look for query param that is equal to the variable name
      let value = getQueryArgument(v.name);

      // Look for an option that should be selected by default
      if (value === null) {
        value = _.find(v.options, { selected: true })?.value;
      }

      // If no default option was found, default to "All" (if present)
      if (value === undefined && v.includeAll) {
        value = MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY;
      }

      allVariables[v.name] = ImmutableMap({
        includeAll: !!v.includeAll,
        isHidden: namespace && v.name === 'namespace' ? true : v.hide !== 0,
        isLoading: namespace ? v.type === 'query' && !namespace : v.type === 'query',
        options: _.map(v.options, 'value'),
        query: v.type === 'query' ? v.query : undefined,
        value: namespace && v.name === 'namespace' ? namespace : value || v.options?.[0]?.value,
      });
    }
  });

  return allVariables;
};
