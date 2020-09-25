import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import {
  watchPrometheusQuery,
  stopWatchPrometheusQuery,
} from '@console/internal/actions/dashboards';
import { RootState } from '@console/internal/redux';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboards';
import {
  getInstantVectorStats,
  GetRangeStats,
  GetInstantStats,
} from '@console/internal/components/graphs/utils';
import { Humanize, HumanizeResult } from '@console/internal/components/utils/types';

export const usePrometheusQuery: UsePrometheusQuery = (query, humanize) => {
  const dispatch = useDispatch();
  React.useEffect(() => {
    dispatch(watchPrometheusQuery(query));
    return () => {
      dispatch(stopWatchPrometheusQuery(query));
    };
  }, [dispatch, query]);

  const queryResult = useSelector<RootState, ImmutableMap<string, any>>(({ dashboards }) =>
    dashboards.getIn([RESULTS_TYPE.PROMETHEUS, query]),
  );
  const results = React.useMemo<[HumanizeResult, any, number]>(() => {
    if (!queryResult || !queryResult.get('data')) {
      return [{}, null, null] as [HumanizeResult, any, number];
    }
    const value = getInstantVectorStats(queryResult.get('data'))[0]?.y;
    return [humanize(value), queryResult.get('loadError'), value];
  }, [queryResult, humanize]);

  return results;
};

const customSelectorCreator = createSelectorCreator(defaultMemoize, shallowEqual);

export const usePrometheusQueries = <R extends any>(
  queries: string[],
  parser?: GetInstantStats | GetRangeStats,
  namespace?: string,
  timespan?: number,
): UsePrometheusQueriesResult<R> => {
  const dispatch = useDispatch();
  React.useEffect(() => {
    queries.forEach((query) => dispatch(watchPrometheusQuery(query, namespace, timespan)));
    return () => {
      queries.forEach((query) => dispatch(stopWatchPrometheusQuery(query, timespan)));
    };
  }, [dispatch, queries, namespace, timespan]);

  const selectors = React.useMemo(
    () =>
      queries.map((q) => ({ dashboards }) =>
        dashboards.getIn([RESULTS_TYPE.PROMETHEUS, timespan ? `${q}@${timespan}` : q]),
      ),
    [queries, timespan],
  );

  const querySelector = React.useMemo(() => customSelectorCreator(selectors, (...data) => data), [
    selectors,
  ]);

  const queryResults = useSelector<RootState, ImmutableMap<string, any>>(querySelector);

  const results = React.useMemo<UsePrometheusQueriesResult<R>>(() => {
    if (_.isEmpty(queryResults?.[0])) {
      return [queries.map(() => []), true, null];
    }
    const values = queryResults.reduce((acc: R[], curr) => {
      const data = curr.get('data');
      const value = parser ? parser(data) : data;
      return [...acc, value];
    }, []);
    const loadError: boolean = queryResults.some((res) => !!res.get('loadError'));
    const loading: boolean = values.some((res) => _.isEmpty(res));
    return [values, loading, loadError];
  }, [queryResults, queries, parser]);

  return results;
};

type UsePrometheusQuery = (query: string, humanize: Humanize) => [HumanizeResult, any, number];
// [data, loading, loadError]
type UsePrometheusQueriesResult<R> = [R[], boolean, boolean];
