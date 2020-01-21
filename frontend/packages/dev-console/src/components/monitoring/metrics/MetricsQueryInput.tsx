import * as React from 'react';
import { connect } from 'react-redux';
import * as fuzzy from 'fuzzysearch';
import { RootState } from '@console/internal/redux';
import { Dropdown } from '@console/internal/components/utils';
import { queryBrowserRunQueries, queryBrowserPatchQuery } from '@console/internal/actions/ui';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { QueryObj } from '@console/internal/components/monitoring/query-browser';
import { metricsQuery, getTopMetricsQueries } from '../queries';
import './MetricsQueryInput.scss';

const ADD_NEW_QUERY = '#ADD_NEW_QUERY#';

type StateProps = {
  namespace: string;
};

type MetricsQueryInputProps = {
  patchQuery: (patch: QueryObj) => void;
  runQueries: () => never;
  namespace: string;
};

export const MetricsQueryInput: React.FC<MetricsQueryInputProps> = ({
  patchQuery,
  runQueries,
  namespace,
}) => {
  const items = metricsQuery;
  const autocompleteFilter = (text, item) => fuzzy(text, item);
  const defaultActionItem = [
    {
      actionTitle: `Custom Query`,
      actionKey: ADD_NEW_QUERY,
    },
  ];

  const [metric, setMetric] = React.useState('');
  React.useEffect(() => {
    if (metric && metric !== ADD_NEW_QUERY) {
      const query = getTopMetricsQueries(namespace)[metric];
      patchQuery({ text: query });
      runQueries();
    }
  }, [metric, namespace, patchQuery, runQueries]);
  const onChange = (selVal: string) => {
    setMetric(selVal);
  };

  return (
    <Dropdown
      autocompleteFilter={autocompleteFilter}
      items={items || {}}
      actionItems={defaultActionItem}
      dropDownClassName="odc-metrics-query-input dropdown--full-width"
      menuClassName="odc-metrics-query-input__menu dropdown-menu--text-wrap"
      onChange={onChange}
      title={'Select Query'}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
});

const mapDispatchToProps = (dispatch) => ({
  runQueries: () => dispatch(queryBrowserRunQueries()),
  patchQuery: (v: QueryObj) => dispatch(queryBrowserPatchQuery(0, v)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MetricsQueryInput);
