import * as classNames from 'classnames';
import * as React from 'react';
import * as _ from 'lodash-es';
import {
  Chart,
  ChartAxis,
  ChartGroup,
  ChartLine,
  ChartThemeColor,
  ChartThemeVariant,
  ChartTooltip,
  ChartVoronoiContainer,
  getCustomTheme,
} from '@patternfly/react-charts';
import { Alert, Button, TextInput } from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons';
import { connect } from 'react-redux';

import { Dropdown, humanizeNumber, LoadingInline, usePoll, useRefWidth, useSafeFetch } from '../utils';
import { formatPrometheusDuration, parsePrometheusDuration, twentyFourHourTime } from '../utils/datetime';
import { withFallback } from '../utils/error-boundary';
import { PrometheusResponse } from '../graphs';
import { GraphEmpty } from '../graphs/graph-empty';
import { getPrometheusURL, PrometheusEndpoint } from '../graphs/helpers';
import { queryBrowserTheme } from '../graphs/themes';

const spans = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '1d', '2d', '1w', '2w'];
const dropdownItems = _.zipObject(spans, spans);
export const chartTheme = getCustomTheme(ChartThemeColor.multi, ChartThemeVariant.light, queryBrowserTheme);

// Takes a Prometheus labels object and removes the internal labels (those beginning with "__")
export const omitInternalLabels = (labels: Labels): Labels => _.omitBy(labels, (v, k) => _.startsWith(k, '__'));

const Error = ({error}) => <Alert isInline className="co-alert" variant="danger" title="An error occurred">{_.get(error, 'json.error', error.message)}</Alert>;

const SpanControls: React.FC<SpanControlsProps> = React.memo(({defaultSpanText, onChange, span}) => {
  const [isValid, setIsValid] = React.useState(true);
  const [text, setText] = React.useState(formatPrometheusDuration(span));

  React.useEffect(() => {
    setText(formatPrometheusDuration(span));
  }, [span]);

  const debouncedOnChange = React.useCallback(_.debounce(onChange, 400), [onChange]);

  const setSpan = (newText: string, isDebounced = false) => {
    const newSpan = parsePrometheusDuration(newText);
    const newIsValid = (newSpan > 0);
    setIsValid(newIsValid);
    setText(newText);
    if (newIsValid && newSpan !== span) {
      const fn = isDebounced ? debouncedOnChange : onChange;
      fn(newSpan);
    }
  };

  return <React.Fragment>
    <TextInput
      aria-label="graph timespan"
      className="query-browser__span-text"
      isValid={isValid}
      onChange={v => setSpan(v, true)}
      type="text"
      value={text}
    />
    <Dropdown
      buttonClassName="query-browser__span-dropdown-button"
      items={dropdownItems}
      menuClassName="query-browser__span-dropdown-menu"
      noSelection={true}
      onChange={v => setSpan(v)}
      title="&nbsp;"
    />
    <Button
      className="query-browser__inline-control"
      onClick={() => setSpan(defaultSpanText)}
      type="button"
      variant="tertiary"
    >Reset Zoom</Button>
  </React.Fragment>;
});

const Tooltip = ({datum = undefined, metadata, x = 0, y = 0}) => {
  if (!datum) {
    return null;
  }
  const colors = chartTheme.line.colorScale;
  const i = datum._stack - 1;
  const {labels, query} = metadata[i];
  const width = 240;

  // This is actually the max tooltip height, so set it to the available space above the cursor location
  const height = 180 + y;

  return <foreignObject height={height} width={width} x={x - width/2} y={y - height}>
    <div className="query-browser__tooltip-wrap">
      <div className="query-browser__tooltip-arrow"></div>
      <div className="query-browser__tooltip">
        <div className="query-browser__tooltip-group">
          <div className="query-browser__series-btn" style={{backgroundColor: colors[i % colors.length]}}></div>
          {datum.x && <div className="query-browser__tooltip-time">{twentyFourHourTime(datum.x)}</div>}
        </div>
        <div className="query-browser__tooltip-group">
          <div className="co-nowrap co-truncate">{query}</div>
          <div className="query-browser__tooltip-value">{humanizeNumber(datum.y).string}</div>
        </div>
        {_.map(labels, (v, k) => <div key={k}><span className="query-browser__tooltip-label-key">{k}</span> {v}</div>)}
      </div>
    </div>
  </foreignObject>;
};

const Graph: React.FC<GraphProps> = React.memo(({containerComponent, domain, data, span}) => {
  const [containerRef, width] = useRefWidth();

  return <div ref={containerRef} style={{width: '100%'}}>
    {width > 0 && <Chart
      containerComponent={containerComponent}
      domain={domain || {x: [Date.now() - span, Date.now()], y: undefined}}
      domainPadding={{y: 20}}
      height={200}
      scale={{x: 'time', y: 'linear'}}
      theme={chartTheme}
      width={width}
    >
      <ChartAxis tickCount={5} tickFormat={twentyFourHourTime} />
      <ChartAxis dependentAxis tickCount={5} tickFormat={value => humanizeNumber(value).string} />
      <ChartGroup>
        {_.map(data, (values, i) => <ChartLine key={i} data={values} />)}
      </ChartGroup>
    </Chart>}
  </div>;
});

const formatSeriesValues = (values: PrometheusValue[], samples: number, span: number): GraphDataPoint[] => {
  const newValues = _.map(values, v => {
    const y = Number(v[1]);
    return ({
      x: new Date(v[0] * 1000),
      y: Number.isNaN(y) ? null : y,
    });
  });

  // The data may have missing values, so we fill those gaps with nulls so that the graph correctly shows the
  // missing values as gaps in the line
  const start = Number(_.get(newValues, '[0].x'));
  const end = Number(_.get(_.last(newValues), 'x'));
  const step = span / samples;
  _.range(start, end, step).map((t, i) => {
    const x = new Date(t);
    if (_.get(newValues, [i, 'x']) > x) {
      newValues.splice(i, 0, {x, y: null});
    }
  });

  return newValues;
};

const QueryBrowser_: React.FC<QueryBrowserProps> = ({
  defaultTimespan,
  disabledSeries = [],
  filterLabels,
  GraphLink,
  hideGraphs,
  onDataUpdate,
  queries,
}) => {
  // For the default time span, use the first of the suggested span options that is at least as long as defaultTimespan
  const defaultSpanText = spans.find(s => parsePrometheusDuration(s) >= defaultTimespan);

  const [domain, setDomain] = React.useState();
  const [error, setError] = React.useState();
  const [isZooming, setIsZooming] = React.useState(false);
  const [results, setResults] = React.useState();
  const [span, setSpan] = React.useState(parsePrometheusDuration(defaultSpanText));
  const [updating, setUpdating] = React.useState(true);
  const [x1, setX1] = React.useState(0);
  const [x2, setX2] = React.useState(0);

  const endTime = _.get(domain, 'x[1]');

  const samples = 300;

  const safeFetch = useSafeFetch();

  const safeFetchQuery = (query: string) => {
    if (_.isEmpty(query)) {
      return undefined;
    }
    const url = getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      endTime,
      query,
      samples,
      timeout: '5s',
      timespan: span,
    });
    return safeFetch(url);
  };

  const tick = () => Promise.all(_.map(queries, safeFetchQuery))
    .then((responses: PrometheusResponse[]) => {
      const newResults = _.map(responses, 'data.result');
      setResults(newResults);
      if (onDataUpdate) {
        onDataUpdate(newResults);
      }
      setUpdating(false);
      setError(undefined);
    })
    .catch(err => {
      setError(err);
      setUpdating(false);
    });

  // If an end time was set, stop polling since we are no longer displaying the latest data. Otherwise use a polling
  // interval relative to the graph's timespan, but not less than 5s.
  const delay = endTime ? null : Math.max(span / 120, 5000);

  const queriesKey = JSON.stringify(queries);
  const disabledSeriesKey = JSON.stringify(disabledSeries);

  usePoll(tick, delay, endTime, queriesKey, samples, span);

  React.useEffect(() => setUpdating(true), [endTime, queriesKey, samples, span]);

  const graphData: GraphDataPoint[][] = React.useMemo(() => _.flatten(
    _.map(results, (result, responseIndex) => {
      return _.map(result, ({metric, values}) => {
        const labels = omitInternalLabels(metric);

        // If filterLabels is specified, ignore all series that don't match
        const isIgnored = filterLabels
          ? _.some(labels, (v, k) => filterLabels[k] !== v)
          : _.some(disabledSeries[responseIndex], s => _.isEqual(s, labels));

        return isIgnored ? [{x: null, y: null}] : formatSeriesValues(values, samples, span);
      });
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [disabledSeriesKey, filterLabels, results, samples, span]);

  const onSpanChange = React.useCallback((newSpan: number) => {
    setDomain(undefined);
    setSpan(newSpan);
  }, []);

  const containerComponent = React.useMemo(() => {
    const metadata = _.flatMap(results, (r, i) => _.map(r, ({metric}) => ({
      query: queries[i],
      labels: omitInternalLabels(metric),
    })));

    const flyoutComponent = <Tooltip metadata={metadata} />;
    const labelComponent = <ChartTooltip flyoutComponent={flyoutComponent} />;
    return <ChartVoronoiContainer labels={() => ''} labelComponent={labelComponent} />;
  }, [queries, results]);

  if (hideGraphs) {
    return error ? <Error error={error} /> : null;
  }

  const onMouseDown = (e) => {
    if (!isZooming) {
      setIsZooming(true);
      const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
      setX1(x);
      setX2(x);
    }
  };

  const onMouseMove = (e) => {
    if (isZooming) {
      setX2(e.clientX - e.currentTarget.getBoundingClientRect().left);
    }
  };

  const onMouseUp = (e) => {
    if (isZooming) {
      setIsZooming(false);

      const {width} = e.currentTarget.getBoundingClientRect();
      const oldFrom = _.get(domain, 'x[0]', Date.now() - span);
      let from = oldFrom + (span * Math.min(x1, x2) / width);
      let to = oldFrom + (span * Math.max(x1, x2) / width);
      let newSpan = to - from;

      // Don't allow zooming to less than 10 seconds
      const minSpan = 10 * 1000;
      if (newSpan < minSpan) {
        newSpan = minSpan;
        const middle = (from + to) / 2;
        from = middle - (newSpan / 2);
        to = middle + (newSpan / 2);
      }

      setDomain({x: [from, to], y: undefined});
      setSpan(newSpan);
    }
  };

  return <div className={classNames('query-browser__wrapper', {'graph-empty-state': _.isEmpty(graphData)})}>
    <div className="query-browser__controls">
      <div className="query-browser__controls--left">
        <SpanControls defaultSpanText={defaultSpanText} onChange={onSpanChange} span={span} />
        {updating && <div className="query-browser__loading">
          <LoadingInline />
        </div>}
      </div>
      {GraphLink && <div className="query-browser__controls--right">
        <GraphLink />
      </div>}
    </div>
    {error && <Error error={error} />}
    {(_.isEmpty(graphData) && !updating) && <GraphEmpty icon={ChartLineIcon} />}
    {!_.isEmpty(graphData) && <div
      className="graph-wrapper graph-wrapper--query-browser"
    >
      <div className="query-browser__zoom" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
        {isZooming && <div className="query-browser__zoom-overlay" style={{left: Math.min(x1, x2), width: Math.abs(x1 - x2)}}></div>}
        <Graph
          containerComponent={isZooming ? undefined : containerComponent}
          data={graphData}
          domain={domain}
          span={span}
        />
      </div>
    </div>}
  </div>;
};
const stateToProps = ({UI}) => ({hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs'])});
export const QueryBrowser = withFallback(connect(stateToProps)(QueryBrowser_));

type Domain = {
  x: [number, number];
  y: [number, number];
};

type GraphDataPoint = {
  x: Date;
  y: number;
};

export type Labels = {[key: string]: string};

type PrometheusValue = [number, string];

export type PrometheusSeries = {
  metric: Labels;
  values: PrometheusValue[];
};

type GraphProps = {
  containerComponent: React.ReactElement;
  data: GraphDataPoint[][];
  domain: Domain;
  span: number;
};

type QueryBrowserProps = {
  defaultTimespan: number;
  disabledSeries?: Labels[][];
  filterLabels?: Labels;
  GraphLink?: React.ComponentType<{}>;
  hideGraphs: boolean;
  onDataUpdate?: (allSeries: PrometheusSeries[][]) => void;
  queries: string[];
};

type SpanControlsProps = {
  defaultSpanText: string;
  onChange: (span: number) => void;
  span: number;
};
