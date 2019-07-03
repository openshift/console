import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash-es';
import { Switch } from '@patternfly/react-core';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import * as UIActions from '../../actions/ui';
import { connectToURLs, MonitoringRoutes } from '../../reducers/monitoring';
import { PROMETHEUS_BASE_PATH } from '../graphs';
import { PrometheusEndpoint } from '../graphs/helpers';
import { getPrometheusExpressionBrowserURL } from '../graphs/prometheus-graph';
import { ActionsMenu, Dropdown, ExternalLink, getURLSearchParams, Kebab, LoadingInline, useSafeFetch } from '../utils';
import { withFallback } from '../utils/error-boundary';
import { graphColors, Labels, PrometheusSeries, QueryBrowser } from './query-browser';

const aggregationOperators = [
  'avg',
  'bottomk',
  'count',
  'count_values',
  'max',
  'min',
  'quantile',
  'stddev',
  'stdvar',
  'sum',
  'topk',
];

const prometheusFunctions = [
  'abs()',
  'absent()',
  'avg_over_time()',
  'ceil()',
  'changes()',
  'clamp_max()',
  'clamp_min()',
  'count_over_time()',
  'day_of_month()',
  'day_of_week()',
  'days_in_month()',
  'delta()',
  'deriv()',
  'exp()',
  'floor()',
  'histogram_quantile()',
  'holt_winters()',
  'hour()',
  'idelta()',
  'increase()',
  'irate()',
  'label_join()',
  'label_replace()',
  'ln()',
  'log10()',
  'log2()',
  'max_over_time()',
  'min_over_time()',
  'minute()',
  'month()',
  'predict_linear()',
  'quantile_over_time()',
  'rate()',
  'resets()',
  'round()',
  'scalar()',
  'sort()',
  'sort_desc()',
  'sqrt()',
  'stddev_over_time()',
  'stdvar_over_time()',
  'sum_over_time()',
  'time()',
  'timestamp()',
  'vector()',
  'year()',
];

const HeaderPrometheusLink_ = ({queries, urls}) => {
  const url = getPrometheusExpressionBrowserURL(urls, queries);
  return _.isEmpty(url)
    ? null
    : <span className="monitoring-header-link">
      <ExternalLink href={url} text="Prometheus UI" />
    </span>;
};
const HeaderPrometheusLink = connectToURLs(MonitoringRoutes.Prometheus)(HeaderPrometheusLink_);

export const graphStateToProps = ({UI}) => ({hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs'])});

const ToggleGraph_ = ({hideGraphs, toggle}) => {
  const iconClass = `fa fa-${hideGraphs ? 'line-chart' : 'compress'}`;
  return <button type="button" className="btn btn-link" onClick={toggle}>
    {hideGraphs ? 'Show' : 'Hide'} Graph <i className={iconClass} aria-hidden="true" />
  </button>;
};
export const ToggleGraph = connect(graphStateToProps, {toggle: UIActions.monitoringToggleGraphs})(ToggleGraph_);

const MetricsDropdown = ({onChange, onLoad}) => {
  const [items, setItems] = React.useState({});
  const [isError, setIsError] = React.useState(false);

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    safeFetch(`${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.LABEL}/__name__/values`)
      .then(({data}) => {
        setItems(_.zipObject(data, data));
        if (onLoad) {
          onLoad(data);
        }
      })
      .catch(() => setIsError(true));
  }, [onLoad, safeFetch]);

  let title: React.ReactNode = 'Insert Metric at Cursor';
  if (isError) {
    title = 'Failed to load metrics list';
  } else if (_.isEmpty(items)) {
    title = <LoadingInline />;
  }

  return <Dropdown
    autocompleteFilter={fuzzy}
    id="metrics-dropdown"
    items={items}
    menuClassName="query-browser__metrics-dropdown-menu query-browser__metrics-dropdown-menu--insert"
    onChange={onChange}
    title={title}
  />;
};

const ExpandButton = ({isExpanded, onClick}) => {
  const title = `${isExpanded ? 'Hide' : 'Show'} Table`;
  return <button aria-label={title} className="btn btn-link query-browser__expand-button" onClick={onClick} title={title}>
    <i aria-hidden="true" className={`fa fa-angle-${isExpanded ? 'down' : 'right'} query-browser__expand-icon`} />
  </button>;
};

const SeriesButton = ({colorIndex, isDisabled, onClick}) => {
  const title = `${isDisabled ? 'Show' : 'Hide'} series`;
  return <button
    aria-label={title}
    className={classNames('query-browser__series-btn', {'query-browser__series-btn--disabled': isDisabled})}
    onClick={onClick}
    style={isDisabled ? undefined : {backgroundColor: graphColors[colorIndex % graphColors.length]}}
    title={title}
    type="button"
  ></button>;
};

const QueryInput: React.FC<QueryInputProps> = ({metrics = [], onBlur, onSubmit, onUpdate, value = ''}) => {
  const [token, setToken] = React.useState('');

  const inputRef = React.useRef(null);

  const getTextBeforeCursor = () => inputRef.current.value.substring(0, inputRef.current.selectionEnd);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(e.target.value);

    // Metric and function names can only contain the characters a-z, A-Z, 0-9, '_' and ':'
    const allTokens = getTextBeforeCursor().split(/[^a-zA-Z0-9_:]+/);

    setToken(_.last(allTokens));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter+Shift inserts newlines, Enter alone runs the query
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      setToken('');
    }
  };

  const onTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!_.get(e, 'relatedTarget.dataset.autocomplete')) {
      onBlur(e);
      setToken('');
    }
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Replace the autocomplete token with the selected autocomplete option
    const re = new RegExp(`${_.escapeRegExp(token)}$`);
    const newTextBeforeCursor = getTextBeforeCursor().replace(re, e.currentTarget.dataset.autocomplete);
    onUpdate(newTextBeforeCursor + value.substring(inputRef.current.selectionEnd));

    setToken('');
    inputRef.current.focus();

    // Move cursor to just after the text we inserted (use _.defer() so this is called after the textarea value is set)
    const cursorPosition = newTextBeforeCursor.length;
    _.defer(() => inputRef.current.setSelectionRange(cursorPosition, cursorPosition));
  };

  const isMatch = v => fuzzy(token.toLowerCase(), v.toLowerCase());
  const allSuggestions = token.length < 2
    ? {}
    : _.omitBy({
      ['Aggregation Operators']: aggregationOperators.filter(isMatch),
      ['Functions']: prometheusFunctions.filter(isMatch),
      ['Metrics']: metrics.filter(isMatch),
    }, _.isEmpty);

  // Set the default textarea height to the number of lines in the query text
  const rows = _.clamp((value.match(/\n/g) || []).length + 1, 2, 10);

  return <div className="query-browser__query query-browser__inline-control pf-c-dropdown">
    <textarea
      autoFocus
      className="form-control query-browser__query-input"
      onBlur={onTextareaBlur}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder="Expression (press Shift+Enter for newlines)"
      ref={inputRef}
      rows={rows}
      spellCheck={false}
      value={value}
    />
    {!_.isEmpty(allSuggestions) && <ul className="pf-c-dropdown__menu query-browser__metrics-dropdown-menu">
      {_.map(allSuggestions, (suggestions, title) => <React.Fragment key={title}>
        <div className="text-muted query-browser__dropdown--subtitle">{title}</div>
        {_.map(suggestions, s => <li key={s}>
          <a href="#" className="pf-c-dropdown__menu-item" data-autocomplete={s} onClick={onClick}>{s}</a>
        </li>)}
      </React.Fragment>)}
    </ul>}
  </div>;
};

const Query: React.FC<QueryProps> = ({colorOffset, metrics, onBlur, onDelete, onSubmit, onUpdate, query}) => {
  const {allSeries, disabledSeries, enabled, expanded, text} = query;

  const toggleEnabled = () => onUpdate({enabled: !enabled, expanded: !enabled, query: enabled ? '' : text});

  const toggleAllSeries = () => onUpdate({disabledSeries: _.isEmpty(disabledSeries) ? _.map(allSeries, 'labels') : []});

  const kebabOptions = [
    {label: `${enabled ? 'Disable' : 'Enable'} query`, callback: toggleEnabled},
    {label: `${_.isEmpty(disabledSeries) ? 'Hide' : 'Show'} all series`, callback: toggleAllSeries},
    {label: 'Delete query', callback: onDelete},
  ];

  return <div className="group">
    <div className="group__title">
      <ExpandButton isExpanded={expanded} onClick={() => onUpdate({expanded: !expanded})} />
      <QueryInput
        metrics={metrics}
        onBlur={onBlur}
        onSubmit={onSubmit}
        onUpdate={v => onUpdate({text: v})}
        value={text}
      />
      <div className="query-browser__inline-control">
        <Switch aria-label={`${enabled ? 'Disable' : 'Enable'} query`} isChecked={enabled} onChange={toggleEnabled} />
      </div>
      <div className="dropdown-kebab-pf">
        <Kebab options={kebabOptions} />
      </div>
    </div>
    {expanded && <div className="group__body group__body--query-browser">
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-9">
            <div className="query-browser-metric__color"></div>
            Series
          </div>
          <div className="col-xs-3">Value</div>
        </div>
        <div className="co-m-table-grid__body">
          {_.map(allSeries, ({labels, value}, i) => <div className="row" key={i}>
            <div className="col-xs-9 query-browser-metric__wrapper">
              <SeriesButton
                colorIndex={colorOffset + i}
                isDisabled={_.some(disabledSeries, s => _.isEqual(s, labels))}
                onClick={() => onUpdate({disabledSeries: _.xorWith(disabledSeries, [labels], _.isEqual)})}
              />
              <div className="query-browser-metric__labels">
                {_.isEmpty(labels)
                  ? <span className="text-muted">{'{}'}</span>
                  : _.map(labels, (v, k) => `${k}="${v}"`).join(',')}
              </div>
            </div>
            <div className="col-xs-3">{value}</div>
          </div>)}
        </div>
      </div>
    </div>}
  </div>;
};

export const QueryBrowserPage = withFallback(() => {
  const [focusedQuery, setFocusedQuery] = React.useState();
  const [metrics, setMetrics] = React.useState();
  const [restoreSelection, setRestoreSelection] = React.useState();

  const defaultQuery = getURLSearchParams().query || '';

  // `text` is the current string in the text input and `query` is the value displayed in the graph
  const [queries, setQueries] = React.useState([{
    disabledSeries: [],
    enabled: true,
    expanded: true,
    query: defaultQuery,
    text: defaultQuery,
  }]);

  const defaultQueryObj = {disabledSeries: [], enabled: true, expanded: true, query: '', text: ''};

  const updateQuery = (i: number, patch: PrometheusQuery) => {
    setQueries(_.map(queries, (q, j) => i === j ? Object.assign({}, q, patch) : q));
  };

  const addQuery = () => setQueries([...queries, defaultQueryObj]);

  const deleteAllQueries = () => setQueries([defaultQueryObj]);

  const runQueries = () => setQueries(queries.map(q => q.enabled ? Object.assign({}, q, {query: q.text}) : q));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runQueries();
  };

  const isAllExpanded = _.every(queries, 'expanded');
  const toggleAllExpanded = () => setQueries(_.map(queries, q => Object.assign({}, q, {expanded: !isAllExpanded})));

  const actionsMenuActions = [
    {label: 'Add query', callback: addQuery},
    {label: `${isAllExpanded ? 'Collapse' : 'Expand'} all query tables`, callback: toggleAllExpanded},
    {label: 'Delete all queries', callback: deleteAllQueries},
  ];

  const onDataUpdate = (allQueries: PrometheusSeries[][]) => {
    const newQueries = _.map(allQueries, (querySeries, i) => {
      const allSeries = _.map(querySeries, s => ({
        labels: _.omit(s.metric, '__name__'),
        value: parseFloat(_.last(s.values)[1]),
      }));
      return Object.assign({}, queries[i], {allSeries});
    });
    setQueries(newQueries);
  };

  const onMetricChange = (metric: string) => {
    if (focusedQuery) {
      // Replace the currently selected text with the metric
      const {index, selection, target} = focusedQuery;
      const oldText = _.get(queries, [index, 'text']);
      const text = oldText.substring(0, selection.start) + metric + oldText.substring(selection.end);
      updateQuery(index, {text});
      target.focus();

      // Restore the cursor position / currently selected text
      setRestoreSelection([selection.start, selection.start + metric.length]);
    } else {
      // No focused query, so add the metric to the end of the first query input
      updateQuery(0, {text: _.get(queries, [0, 'text']) + metric});
    }
  };

  React.useEffect(() => {
    if (focusedQuery && restoreSelection) {
      focusedQuery.target.setSelectionRange(...restoreSelection);
    }
  }, [focusedQuery, restoreSelection]);

  let colorOffset = 0;

  return <React.Fragment>
    <Helmet>
      <title>Metrics</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">
        <span>Metrics<HeaderPrometheusLink queries={_.map(queries, 'query')} /></span>
        <div className="co-actions">
          <ActionsMenu actions={actionsMenuActions} />
        </div>
      </h1>
    </div>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12 text-right">
          <ToggleGraph />
        </div>
      </div>
      <div className="row">
        <div className="col-xs-12">
          <QueryBrowser
            defaultTimespan={30 * 60 * 1000}
            disabledSeries={_.map(queries, 'disabledSeries')}
            onDataUpdate={onDataUpdate}
            queries={_.map(queries, 'query')}
          />
          <form onSubmit={onSubmit}>
            <div className="query-browser__controls">
              <div className="query-browser__controls--left">
                <MetricsDropdown onChange={onMetricChange} onLoad={setMetrics} />
              </div>
              <div className="query-browser__controls--right">
                <button type="button" className="btn btn-default query-browser__inline-control" onClick={addQuery}>Add Query</button>
                <button type="submit" className="btn btn-primary">Run Queries</button>
              </div>
            </div>
            {_.map(queries, (q, i) => {
              const deleteQuery = () => setQueries(queries.length <= 1
                ? [defaultQueryObj]
                : queries.filter((v, k) => k !== i));

              const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
                if (_.get(e, 'relatedTarget.id') === 'metrics-dropdown') {
                  // Focus has shifted from a query input to the metrics dropdown, so store the cursor position so we
                  // know where to insert the metric when it is selected
                  setFocusedQuery({
                    index: i,
                    selection: {
                      start: e.target.selectionStart,
                      end: e.target.selectionEnd,
                    },
                    target: e.target,
                  });
                } else {
                  // Focus is shifting to somewhere other than the metrics dropdown, so don't track the cursor position
                  setFocusedQuery(undefined);
                }
              };

              colorOffset += _.get(queries, [i - 1, 'allSeries', 'length'], 0);

              return <Query
                colorOffset={colorOffset}
                key={i}
                metrics={metrics}
                onBlur={onBlur}
                onDelete={deleteQuery}
                onSubmit={runQueries}
                onUpdate={patch => updateQuery(i, patch)}
                query={q}
              />;
            })}
          </form>
        </div>
      </div>
    </div>
  </React.Fragment>;
});

type PrometheusQuery = {
  allSeries?: {labels: Labels, value: number}[];
  disabledSeries?: Labels[];
  enabled?: boolean;
  expanded?: boolean;
  query?: string;
  text?: string;
};
type QueryProps = {
  colorOffset: number;
  metrics: string[],
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onUpdate: (patch: PrometheusQuery) => void;
  query: PrometheusQuery;
};
type QueryInputProps = {
  metrics: string[],
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onUpdate: (text: string) => void;
  value: string,
};
