import * as classNames from 'classnames';
import * as React from 'react';
import * as _ from 'lodash-es';
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartGroup,
  ChartLegend,
  ChartLine,
  ChartStack,
  ChartThemeColor,
  ChartThemeVariant,
  ChartTooltip,
  ChartVoronoiContainer,
  getCustomTheme,
} from '@patternfly/react-charts';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons';
import { connect } from 'react-redux';
import { APIError } from '@console/shared';
import { withFallback } from '@console/shared/src/components/error/error-boundary';

import * as UIActions from '../../actions/ui';
import { RootState } from '../../redux';
import { PrometheusLabels, PrometheusResponse, PrometheusResult, PrometheusValue } from '../graphs';
import { GraphEmpty } from '../graphs/graph-empty';
import { getPrometheusURL, PrometheusEndpoint } from '../graphs/helpers';
import { queryBrowserTheme } from '../graphs/themes';
import {
  Dropdown,
  humanizeNumberSI,
  LoadingInline,
  usePoll,
  useRefWidth,
  useSafeFetch,
} from '../utils';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
  twentyFourHourTime,
  twentyFourHourTimeWithSeconds,
} from '../utils/datetime';

const spans = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '1d', '2d', '1w', '2w'];
const dropdownItems = _.zipObject(spans, spans);
const chartTheme = getCustomTheme(
  ChartThemeColor.multi,
  ChartThemeVariant.light,
  queryBrowserTheme,
);
export const colors = chartTheme.line.colorScale;

// Use exponential notation for small or very large numbers to avoid labels with too many characters
const formatPositiveValue = (v: number): string =>
  v === 0 || (0.001 <= v && v < 1e23) ? humanizeNumberSI(v).string : v.toExponential(1);
const formatValue = (v: number): string => (v < 0 ? '-' : '') + formatPositiveValue(Math.abs(v));

export const Error: React.FC<ErrorProps> = ({ error, title = 'An error occurred' }) => (
  <Alert isInline className="co-alert" title={title} variant="danger">
    {_.get(error, 'json.error', error.message)}
  </Alert>
);

const GraphEmptyState: React.FC<GraphEmptyStateProps> = ({ children, title }) => (
  <div className="query-browser__wrapper graph-empty-state">
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateIcon size="sm" icon={ChartLineIcon} />
      <Title size="sm">{title}</Title>
      <EmptyStateBody>{children}</EmptyStateBody>
    </EmptyState>
  </div>
);

const SpanControls: React.FC<SpanControlsProps> = React.memo(
  ({ defaultSpanText, onChange, span }) => {
    const [isValid, setIsValid] = React.useState(true);
    const [text, setText] = React.useState(formatPrometheusDuration(span));

    React.useEffect(() => {
      setText(formatPrometheusDuration(span));
    }, [span]);

    const debouncedOnChange = React.useCallback(_.debounce(onChange, 400), [onChange]);

    const setSpan = (newText: string, isDebounced = false) => {
      const newSpan = parsePrometheusDuration(newText);
      const newIsValid = newSpan > 0;
      setIsValid(newIsValid);
      setText(newText);
      if (newIsValid && newSpan !== span) {
        const fn = isDebounced ? debouncedOnChange : onChange;
        fn(newSpan);
      }
    };

    return (
      <>
        <TextInput
          aria-label="graph timespan"
          className="query-browser__span-text"
          isValid={isValid}
          onChange={(v) => setSpan(v, true)}
          type="text"
          value={text}
        />
        <Dropdown
          ariaLabel="graph timespan"
          buttonClassName="dropdown-button--icon-only"
          items={dropdownItems}
          menuClassName="query-browser__span-dropdown-menu"
          noSelection={true}
          onChange={(v: string) => setSpan(v)}
        />
        <Button
          className="query-browser__inline-control"
          onClick={() => setSpan(defaultSpanText)}
          type="button"
          variant="tertiary"
        >
          Reset Zoom
        </Button>
      </>
    );
  },
);

const tooltipStateToProps = ({ UI }: RootState, { seriesIndex }) => {
  let remaining = seriesIndex;
  let props = {};
  UI.getIn(['queryBrowser', 'queries'])
    .filter((q) => q.get('isEnabled') && q.get('query'))
    .forEach((q) => {
      const series = q.get('series') || [];
      if (series.length > remaining) {
        props = { labels: series[remaining], query: q.get('query') };
        return false;
      }
      remaining -= series.length;
    });
  return props;
};

const TooltipInner_: React.FC<TooltipInnerProps> = ({
  datumX,
  datumY,
  labels,
  query,
  seriesIndex,
  x,
  y,
}) => {
  if (!query && !labels) {
    return null;
  }

  const width = 240;

  // This is actually the max tooltip height
  const height = 500;

  return (
    <foreignObject
      className="query-browser__tooltip-svg-wrap"
      height={height}
      width={width}
      x={x - width / 2}
      y={y}
    >
      <div className="query-browser__tooltip-wrap">
        <div className="query-browser__tooltip-arrow" />
        <div className="query-browser__tooltip">
          <div className="query-browser__tooltip-group">
            <div
              className="query-browser__series-btn"
              style={{ backgroundColor: colors[seriesIndex % colors.length] }}
            />
            {datumX && (
              <div className="query-browser__tooltip-time">
                {twentyFourHourTimeWithSeconds(datumX)}
              </div>
            )}
          </div>
          <div className="query-browser__tooltip-group">
            <div className="co-nowrap co-truncate">{query}</div>
            <div className="query-browser__tooltip-value">{formatValue(datumY)}</div>
          </div>
          {_.map(labels, (v, k) => (
            <div className="co-nowrap co-truncate" key={k}>
              <span className="query-browser__tooltip-label-key">
                {k === '__name__' ? 'name' : k}
              </span>{' '}
              {v}
            </div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
};
const TooltipInner = connect(tooltipStateToProps)(TooltipInner_);

const Tooltip_: React.FC<TooltipProps> = ({ datum, x, y }) =>
  datum && _.isFinite(datum.y) && _.isFinite(x) && _.isFinite(y) ? (
    <TooltipInner datumX={datum.x} datumY={datum.y} seriesIndex={datum._stack - 1} x={x} y={y} />
  ) : null;
const Tooltip = withFallback(Tooltip_);

// The `center` prop is required by ChartTooltip, but is actually overridden by our custom tooltip
const graphLabelComponent = <ChartTooltip center={{ x: 0, y: 0 }} flyoutComponent={<Tooltip />} />;

// Set activateData to false to work around VictoryVoronoiContainer crash (see
// https://github.com/FormidableLabs/victory/issues/1314)
const graphContainer = (
  <ChartVoronoiContainer
    activateData={false}
    className="query-browser__graph-container"
    labelComponent={graphLabelComponent}
    labels={() => ''}
  />
);

const LegendContainer = ({ children }: { children?: React.ReactNode }) => {
  // The first child should be a <rect> with a `width` prop giving the legend's content width
  const width = children?.[0]?.[0]?.props?.width ?? '100%';
  return (
    <foreignObject height={75} width="100%" y={230}>
      <div className="monitoring-dashboards__legend-wrap">
        <svg width={width}>{children}</svg>
      </div>
    </foreignObject>
  );
};

const Graph: React.FC<GraphProps> = React.memo(
  ({ allSeries, disabledSeries, formatLegendLabel, isStack, span, width, xDomain }) => {
    // Remove any disabled series
    const data = _.flatMap(allSeries, (series, i) => {
      return _.map(series, ([metric, values]) => {
        return _.some(disabledSeries[i], (s) => _.isEqual(s, metric)) ? [{}] : values;
      });
    });

    const domain = { x: xDomain || [Date.now() - span, Date.now()], y: undefined };

    let yTickFormat = formatValue;

    if (isStack) {
      // Specify Y axis range if all values are zero, but otherwise let Chart set it automatically
      const isAllZero = _.every(allSeries, (series) =>
        _.every(series, ([, values]) => _.every(values, { y: 0 })),
      );
      if (isAllZero) {
        domain.y = [-1, 1];
      }
    } else {
      // Set a reasonable Y-axis range based on the min and max values in the data
      const findMin = (series: GraphDataPoint[]) => _.minBy(series, 'y');
      const findMax = (series: GraphDataPoint[]) => _.maxBy(series, 'y');
      let minY = _.get(findMin(_.map(data, findMin)), 'y', 0);
      let maxY = _.get(findMax(_.map(data, findMax)), 'y', 0);
      if (minY === 0 && maxY === 0) {
        minY = -1;
        maxY = 1;
      } else if (minY > 0 && maxY > 0) {
        minY = 0;
      } else if (minY < 0 && maxY < 0) {
        maxY = 0;
      }

      domain.y = [minY, maxY];

      if (Math.abs(maxY - minY) < 0.005) {
        yTickFormat = (v: number) => (v === 0 ? '0' : v.toExponential(1));
      }
    }

    const xTickFormat = span < 5 * 60 * 1000 ? twentyFourHourTimeWithSeconds : twentyFourHourTime;

    let xAxisStyle;
    if (width < 225) {
      xAxisStyle = {
        tickLabels: {
          angle: 45,
          fontSize: 10,
          textAnchor: 'start',
          verticalAnchor: 'middle',
        },
      };
    }

    const legendData = formatLegendLabel
      ? _.flatMap(allSeries, (series, i) =>
          _.map(series, (s) => ({ name: formatLegendLabel(s[0], i) })),
        )
      : undefined;

    return (
      <Chart
        containerComponent={graphContainer}
        domain={domain}
        domainPadding={{ y: 1 }}
        height={200}
        scale={{ x: 'time', y: 'linear' }}
        theme={chartTheme}
        width={width}
      >
        <ChartAxis style={xAxisStyle} tickCount={5} tickFormat={xTickFormat} />
        <ChartAxis crossAxis={false} dependentAxis tickCount={6} tickFormat={yTickFormat} />
        {isStack ? (
          <ChartStack>
            {_.map(data, (values, i) => (
              <ChartArea key={i} data={values} />
            ))}
          </ChartStack>
        ) : (
          <ChartGroup>
            {_.map(data, (values, i) => (
              <ChartLine key={i} data={values} />
            ))}
          </ChartGroup>
        )}
        {legendData && (
          <ChartLegend
            data={legendData}
            groupComponent={<LegendContainer />}
            itemsPerRow={4}
            orientation="vertical"
            style={{
              labels: { fontSize: 11 },
            }}
            symbolSpacer={4}
          />
        )}
      </Chart>
    );
  },
);

const formatSeriesValues = (
  values: PrometheusValue[],
  samples: number,
  span: number,
): GraphDataPoint[] => {
  const newValues = _.map(values, (v) => {
    const y = Number(v[1]);
    return {
      x: new Date(v[0] * 1000),
      y: Number.isNaN(y) ? null : y,
    };
  });

  // The data may have missing values, so we fill those gaps with nulls so that the graph correctly
  // shows the missing values as gaps in the line
  const start = Number(_.get(newValues, '[0].x'));
  const end = Number(_.get(_.last(newValues), 'x'));
  const step = span / samples;
  _.range(start, end, step).forEach((t, i) => {
    const x = new Date(t);
    if (_.get(newValues, [i, 'x']) > x) {
      newValues.splice(i, 0, { x, y: null });
    }
  });

  return newValues;
};

// Try to limit the graph to this number of data points
const maxDataPointsSoft = 6000;

// If we have more than this number of data points, do not render the graph
const maxDataPointsHard = 10000;

// Min and max number of data samples per data series
const minSamples = 10;
const maxSamples = 300;

// Fall back to a line chart for performance if there are too many series
const maxStacks = 20;

// We don't want to refresh all the graph data for just a small adjustment in the number of samples,
// so don't update unless the number of samples would change by at least this proportion
const samplesLeeway = 0.2;

// Minimum step (milliseconds between data samples) because tiny steps reduce performance for almost no benefit
const minStep = 5 * 1000;

// Don't allow zooming to less than this number of milliseconds
const minSpan = 30 * 1000;

// Don't poll more often than this number of milliseconds
const minPollInterval = 10 * 1000;

const ZoomableGraph: React.FC<ZoomableGraphProps> = ({
  allSeries,
  disabledSeries,
  formatLegendLabel,
  isStack,
  onZoom,
  span,
  width,
  xDomain,
}) => {
  const [isZooming, setIsZooming] = React.useState(false);
  const [x1, setX1] = React.useState(0);
  const [x2, setX2] = React.useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsZooming(true);
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    setX1(x);
    setX2(x);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    setX2(e.clientX - e.currentTarget.getBoundingClientRect().left);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    setIsZooming(false);

    const xMin = Math.min(x1, x2);
    const xMax = Math.max(x1, x2);

    // Don't do anything if a range was not selected (don't zoom if you just click the graph)
    if (xMax === xMin) {
      return;
    }

    const zoomWidth = e.currentTarget.getBoundingClientRect().width;
    const oldFrom = _.get(xDomain, '[0]', Date.now() - span);
    let from = oldFrom + (span * xMin) / zoomWidth;
    let to = oldFrom + (span * xMax) / zoomWidth;
    let newSpan = to - from;

    if (newSpan < minSpan) {
      newSpan = minSpan;
      const middle = (from + to) / 2;
      from = middle - newSpan / 2;
      to = middle + newSpan / 2;
    }
    onZoom(from, to);
  };

  const handlers = isZooming ? { onMouseMove, onMouseUp } : { onMouseDown };

  return (
    <div className="query-browser__zoom" {...handlers}>
      {isZooming && (
        <div
          className="query-browser__zoom-overlay"
          style={{ left: Math.min(x1, x2), width: Math.abs(x1 - x2) }}
        />
      )}
      <Graph
        allSeries={allSeries}
        disabledSeries={disabledSeries}
        formatLegendLabel={formatLegendLabel}
        isStack={isStack}
        span={span}
        width={width}
        xDomain={xDomain}
      />
    </div>
  );
};

const Loading = () => (
  <div className="query-browser__loading">
    <LoadingInline />
  </div>
);

const QueryBrowser_: React.FC<QueryBrowserProps> = ({
  defaultSamples,
  defaultTimespan = parsePrometheusDuration('30m'),
  disabledSeries = [],
  filterLabels,
  formatLegendLabel,
  GraphLink,
  hideControls,
  hideGraphs,
  isStack = false,
  namespace,
  patchQuery,
  pollInterval,
  queries,
  timespan,
}) => {
  // For the default time span, use the first of the suggested span options that is at least as long
  // as defaultTimespan
  const defaultSpanText = spans.find((s) => parsePrometheusDuration(s) >= defaultTimespan);

  // If we have both `timespan` and `defaultTimespan`, `timespan` takes precedence
  const [span, setSpan] = React.useState(timespan || parsePrometheusDuration(defaultSpanText));

  // Limit the number of samples so that the step size doesn't fall below minStep
  const maxSamplesForSpan =
    defaultSamples || _.clamp(Math.round(span / minStep), minSamples, maxSamples);

  const [xDomain, setXDomain] = React.useState<AxisDomain>();
  const [error, setError] = React.useState<QueryBrowserError>();
  const [isDatasetTooBig, setIsDatasetTooBig] = React.useState(false);
  const [graphData, setGraphData] = React.useState(null);
  const [samples, setSamples] = React.useState(maxSamplesForSpan);
  const [updating, setUpdating] = React.useState(true);

  const [containerRef, width] = useRefWidth();

  const endTime = _.get(xDomain, '[1]');

  const safeFetch = useSafeFetch();

  const stack = isStack && _.sumBy(graphData, 'length') <= maxStacks;

  // If provided, `timespan` overrides any existing span setting
  React.useEffect(() => {
    if (timespan) {
      setSpan(timespan);
    }
  }, [timespan]);

  // Define this once for all queries so that they have exactly the same time range and X values
  const now = Date.now();

  const safeFetchQuery = (query: string) => {
    if (_.isEmpty(query)) {
      return Promise.resolve();
    }
    const url = getPrometheusURL({
      endpoint: PrometheusEndpoint.QUERY_RANGE,
      endTime: endTime || now,
      namespace,
      query,
      samples,
      timeout: '5s',
      timespan: span,
    });
    return safeFetch(url);
  };

  const tick = () =>
    hideGraphs
      ? undefined
      : Promise.all(_.map(queries, safeFetchQuery))
          .then((responses: PrometheusResponse[]) => {
            const newResults = _.map(responses, 'data.result');
            const numDataPoints = _.sumBy(newResults, (r) => _.sumBy(r, 'values.length'));

            if (numDataPoints > maxDataPointsHard && samples === minSamples) {
              setIsDatasetTooBig(true);
              return;
            }
            setIsDatasetTooBig(false);

            const newSamples = _.clamp(
              Math.floor((samples * maxDataPointsSoft) / numDataPoints),
              minSamples,
              maxSamplesForSpan,
            );

            // Change `samples` if either
            //   - It will change by a proportion greater than `samplesLeeway`
            //   - It will change to the upper or lower limit of its allowed range
            if (
              Math.abs(newSamples - samples) / samples > samplesLeeway ||
              (newSamples !== samples &&
                (newSamples === maxSamplesForSpan || newSamples === minSamples))
            ) {
              setSamples(newSamples);
            } else {
              const newGraphData = _.map(newResults, (result: PrometheusResult[]) => {
                return _.map(result, ({ metric, values }) => {
                  // If filterLabels is specified, ignore all series that don't match
                  return _.some(filterLabels, (v, k) => _.has(metric, k) && metric[k] !== v)
                    ? []
                    : [metric, formatSeriesValues(values, samples, span)];
                });
              });
              setGraphData(newGraphData);

              _.each(newResults, (r, i) =>
                patchQuery(i, {
                  series: r ? _.map(r, 'metric') : undefined,
                }),
              );
              setUpdating(false);
            }
            setError(undefined);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              setError(err);
              setUpdating(false);
            }
          });

  // Don't poll if an end time was set (because the latest data is not displayed) or if the graph is
  // hidden. Otherwise use a polling interval relative to the graph's timespan.
  const tickInterval =
    pollInterval === undefined ? Math.max(span / 120, minPollInterval) : pollInterval;
  const delay = endTime || hideGraphs ? null : tickInterval;

  const queriesKey = _.reject(queries, _.isEmpty).join();
  usePoll(tick, delay, endTime, filterLabels, namespace, queriesKey, samples, span);

  React.useLayoutEffect(() => setUpdating(true), [endTime, namespace, queriesKey, samples, span]);

  const onSpanChange = React.useCallback((newSpan: number) => {
    setXDomain(undefined);
    setSpan(newSpan);
  }, []);

  const isRangeVector = _.get(error, 'json.error', '').match(
    /invalid expression type "range vector"/,
  );

  if (hideGraphs) {
    // Still render the graph containers so that `width` continues to be tracked while the graph is
    // hidden. This ensures we can render at the correct width when the graph is shown again.
    return (
      <>
        {error && !isRangeVector && <Error error={error} />}
        <div className="query-browser__wrapper query-browser__wrapper--hidden">
          <div className="graph-wrapper graph-wrapper--query-browser">
            <div ref={containerRef} style={{ width: '100%' }}></div>
          </div>
        </div>
      </>
    );
  }

  if (isRangeVector) {
    return (
      <GraphEmptyState title="Ungraphable results">
        Query results include range vectors, which cannot be graphed. Try adding a function to
        transform the data.
      </GraphEmptyState>
    );
  }

  if (isDatasetTooBig) {
    return (
      <GraphEmptyState title="Ungraphable results">
        The resulting dataset is too large to graph.
      </GraphEmptyState>
    );
  }

  const onZoom = (from: number, to: number) => {
    setXDomain([from, to]);
    setSpan(to - from);
  };

  return (
    <div
      className={classNames('query-browser__wrapper', {
        'graph-empty-state': _.isEmpty(graphData),
      })}
    >
      {hideControls ? (
        <>{updating && <Loading />}</>
      ) : (
        <div className="query-browser__controls">
          <div className="query-browser__controls--left">
            <SpanControls defaultSpanText={defaultSpanText} onChange={onSpanChange} span={span} />
            {updating && <Loading />}
          </div>
          {GraphLink && (
            <div className="query-browser__controls--right">
              <GraphLink />
            </div>
          )}
        </div>
      )}
      {error && <Error error={error} />}
      {_.isEmpty(graphData) && !updating && <GraphEmpty />}
      {!_.isEmpty(graphData) && (
        <>
          {samples < maxSamplesForSpan && !updating && (
            <Alert
              isInline
              className="co-alert"
              title="Displaying with reduced resolution due to large dataset."
              variant="info"
            />
          )}
          <div className="graph-wrapper graph-wrapper--query-browser">
            <div ref={containerRef} style={{ width: '100%' }}>
              {width > 0 && (
                <>
                  {hideControls ? (
                    <Graph
                      allSeries={graphData}
                      disabledSeries={disabledSeries}
                      formatLegendLabel={formatLegendLabel}
                      isStack={stack}
                      span={span}
                      width={width}
                      xDomain={xDomain}
                    />
                  ) : (
                    <ZoomableGraph
                      allSeries={graphData}
                      disabledSeries={disabledSeries}
                      formatLegendLabel={formatLegendLabel}
                      isStack={stack}
                      onZoom={onZoom}
                      span={span}
                      width={width}
                      xDomain={xDomain}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export const QueryBrowser = withFallback(
  connect(({ UI }: RootState) => ({ hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs']) }), {
    patchQuery: UIActions.queryBrowserPatchQuery,
  })(QueryBrowser_),
);

type AxisDomain = [number, number];

type GraphDataPoint = {
  x: Date;
  y: number;
};

type Series = [PrometheusLabels, GraphDataPoint[][]];

export type QueryObj = {
  disabledSeries?: PrometheusLabels[];
  isEnabled?: boolean;
  isExpanded?: boolean;
  query?: string;
  series?: PrometheusLabels[];
  text?: string;
};

export type FormatLegendLabel = (labels: PrometheusLabels, i: number) => string;

export type PatchQuery = (index: number, patch: QueryObj) => any;

type QueryBrowserError = {
  json?: {
    error?: string;
  };
} & APIError;

type ErrorProps = {
  error: QueryBrowserError;
  title?: string;
};

type GraphEmptyStateProps = {
  children: React.ReactNode;
  title: string;
};

type GraphProps = {
  allSeries: Series[][];
  disabledSeries?: PrometheusLabels[][];
  formatLegendLabel?: FormatLegendLabel;
  isStack?: boolean;
  span: number;
  width: number;
  xDomain?: AxisDomain;
};

type ZoomableGraphProps = GraphProps & { onZoom: (from: number, to: number) => void };

export type QueryBrowserProps = {
  defaultSamples?: number;
  defaultTimespan?: number;
  disabledSeries?: PrometheusLabels[][];
  filterLabels?: PrometheusLabels;
  formatLegendLabel?: FormatLegendLabel;
  GraphLink?: React.ComponentType<{}>;
  hideControls?: boolean;
  hideGraphs: boolean;
  isStack?: boolean;
  namespace?: string;
  patchQuery: PatchQuery;
  pollInterval?: number;
  queries: string[];
  timespan?: number;
};

type SpanControlsProps = {
  defaultSpanText: string;
  onChange: (span: number) => void;
  span: number;
};

type TooltipDatum = { _stack: number; x: Date; y: number };

type TooltipInnerProps = {
  datumX: Date;
  datumY: number;
  labels?: PrometheusLabels;
  query?: string;
  seriesIndex: number;
  x: number;
  y: number;
};

type TooltipProps = {
  datum?: TooltipDatum;
  x?: number;
  y?: number;
};
