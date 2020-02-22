import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import * as fuzzy from 'fuzzysearch';
import { RootState } from '@console/internal/redux';
import { Button } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { queryBrowserRunQueries, queryBrowserPatchQuery } from '@console/internal/actions/ui';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { QueryInput } from '@console/internal/components/monitoring/metrics';
import { QueryObj } from '@console/internal/components/monitoring/query-browser';
import { metricsQuery, getTopMetricsQueries } from '../queries';
import './MetricsQueryInput.scss';

const ADD_NEW_QUERY = '#ADD_NEW_QUERY#';
const CUSTOM_QUERY = 'Custom Query';

const MetricsQueryInput: React.FC = () => {
  const items = metricsQuery;
  const autocompleteFilter = (strText, item) => fuzzy(strText, item);
  const defaultActionItem = [
    {
      actionTitle: CUSTOM_QUERY,
      actionKey: ADD_NEW_QUERY,
    },
  ];

  const namespace = useSelector((state: RootState) => getActiveNamespace(state));
  const queries = useSelector((state: RootState) =>
    state.UI.getIn(['queryBrowser', 'queries', 0]).toJS(),
  );
  const dispatch = useDispatch();

  const [title, setTitle] = React.useState('Select Query');
  const [metric, setMetric] = React.useState('');
  const [showPromQl, setShowPromQl] = React.useState(false);
  const [isPromQlDisabled, setIsPromQlDisabled] = React.useState(false);
  React.useEffect(() => {
    const runQueries = () => dispatch(queryBrowserRunQueries());
    const patchQuery = (v: QueryObj) => dispatch(queryBrowserPatchQuery(0, v));
    if (metric) {
      const queryMetrics = getTopMetricsQueries(namespace)[metric];
      patchQuery({ text: queryMetrics || '' });
      runQueries();
    }
  }, [dispatch, metric, namespace]);

  React.useEffect(() => {
    const query = queries?.query;
    const text = queries?.text;
    if (text && text.localeCompare(query) !== 0) {
      setTitle(CUSTOM_QUERY);
      setIsPromQlDisabled(true);
    }
  }, [queries]);

  const onChange = (selectedValue: string) => {
    setMetric(selectedValue);
    if (selectedValue && selectedValue === ADD_NEW_QUERY) {
      setTitle(CUSTOM_QUERY);
      setIsPromQlDisabled(true);
      setShowPromQl(true);
    } else {
      setTitle(selectedValue);
      setIsPromQlDisabled(false);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-xs-8 col-md-6">
          <Dropdown
            autocompleteFilter={autocompleteFilter}
            items={items || {}}
            actionItems={defaultActionItem}
            dropDownClassName="odc-metrics-query-input dropdown--full-width"
            menuClassName="odc-metrics-query-input__menu dropdown-menu--text-wrap"
            onChange={onChange}
            title={title}
          />
        </div>
        <div className="col-xs-4 col-md-6">
          <Button
            variant="link"
            type="button"
            isDisabled={isPromQlDisabled}
            onClick={() => setShowPromQl(!showPromQl)}
          >
            {showPromQl ? 'Hide PromQL' : 'Show PromQL'}
          </Button>
        </div>
      </div>
      {showPromQl && (
        <div className="row">
          <div className="col-xs-12">
            <QueryInput index={0} namespace={namespace} />
          </div>
        </div>
      )}
    </>
  );
};

export default MetricsQueryInput;
