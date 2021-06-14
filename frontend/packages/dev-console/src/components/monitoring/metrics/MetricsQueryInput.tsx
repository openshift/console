import * as React from 'react';
import { Button } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import {
  queryBrowserRunQueries,
  queryBrowserPatchQuery,
  queryBrowserSetMetrics,
} from '@console/internal/actions/ui';
import { PROMETHEUS_BASE_PATH } from '@console/internal/components/graphs';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { QueryInput } from '@console/internal/components/monitoring/metrics';
import { QueryObj } from '@console/internal/components/monitoring/query-browser';
import {
  Dropdown,
  removeQueryArgument,
  useSafeFetch,
  getURLSearchParams,
} from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { metricsQuery, getTopMetricsQueries } from '../queries';
import './MetricsQueryInput.scss';

const ADD_NEW_QUERY = '#ADD_NEW_QUERY#';

const MetricsQueryInput: React.FC = () => {
  const { t } = useTranslation();
  const CUSTOM_QUERY = t('devconsole~Custom query');
  const DEFAULT_TITLE = t('devconsole~Select query');
  const params = getURLSearchParams();
  const query = params.query0;
  const items = metricsQuery(t);
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
  const [title, setTitle] = React.useState(DEFAULT_TITLE);
  const [selectedKey, setSelectedKey] = React.useState('');
  const [changeKey, setChangeKey] = React.useState(false);
  const [metric, setMetric] = React.useState('');
  const [showPromQl, setShowPromQl] = React.useState(false);
  const [isPromQlDisabled, setIsPromQlDisabled] = React.useState(false);
  const safeFetch = React.useCallback(useSafeFetch(), []);
  React.useEffect(() => {
    const runQueries = () => dispatch(queryBrowserRunQueries());
    const patchQuery = (v: QueryObj) => dispatch(queryBrowserPatchQuery(0, v));
    const queryMetrics = metric && getTopMetricsQueries(namespace, t)[metric];
    patchQuery({ text: queryMetrics || query || '' });
    runQueries();
  }, [dispatch, metric, query, namespace, changeKey, t]);

  React.useEffect(() => {
    const q = queries?.query;
    const text = queries?.text;
    if (text && text.localeCompare(q) !== 0) {
      setTitle(CUSTOM_QUERY);
      setIsPromQlDisabled(true);
      if (query) {
        removeQueryArgument('query0');
      }
    }
  }, [query, queries, CUSTOM_QUERY]);

  React.useEffect(() => {
    if (query) {
      const topMetricsQueries = getTopMetricsQueries(namespace, t);
      const selectedQuery = _.findKey(topMetricsQueries, (topQuery) => topQuery === query);
      const sKey = _.findKey(items, (item) => item === selectedQuery);
      setMetric(selectedQuery);
      selectedQuery ? setSelectedKey(sKey) : setTitle(CUSTOM_QUERY);
    }
  }, [query, namespace, items, CUSTOM_QUERY, t]);

  React.useEffect(() => {
    const setMetrics = (metrics: string[]) => dispatch(queryBrowserSetMetrics(metrics));
    const url = namespace
      ? getPrometheusURL({
          endpoint: PrometheusEndpoint.QUERY,
          namespace,
          query: `count({namespace="${namespace}"}) by (__name__)`,
        })
      : `${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.LABEL}/__name__/values`;
    safeFetch(url)
      .then((response) => {
        const metrics = namespace
          ? _.map(_.get(response, 'data.result'), 'metric.__name__').sort()
          : _.get(response, 'data');
        setMetrics(metrics);
      })
      .catch(() => {});
  }, [namespace, safeFetch, dispatch]);

  const onChange = (selectedValue: string) => {
    setMetric(metricsQuery(t)[selectedValue]);
    setChangeKey(!changeKey);
    if (selectedValue && selectedValue === ADD_NEW_QUERY) {
      setTitle(CUSTOM_QUERY);
      setIsPromQlDisabled(true);
      setShowPromQl(true);
    } else {
      setTitle(metricsQuery(t)[selectedValue]);
      setIsPromQlDisabled(false);
    }
    if (query) {
      removeQueryArgument('query0');
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-xs-8 col-md-6">
          <Dropdown
            autocompleteFilter={autocompleteFilter}
            items={items || {}}
            selectedKey={selectedKey}
            actionItems={defaultActionItem}
            dropDownClassName="odc-metrics-query-input dropdown--full-width"
            data-test="odc-monitoring-metrics-query-filter"
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
            {showPromQl ? t('devconsole~Hide PromQL') : t('devconsole~Show PromQL')}
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
