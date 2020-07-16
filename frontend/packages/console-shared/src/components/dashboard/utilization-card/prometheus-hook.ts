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
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { Humanize, HumanizeResult } from '@console/internal/components/utils/types';
import { DataPoint } from '@console/internal/components/graphs';

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

export const usePrometheusQueries: UsePrometheusQueries = (queries, metric) => {
  const dispatch = useDispatch();
  React.useEffect(() => {
    queries.forEach((query) => dispatch(watchPrometheusQuery(query)));
    return () => {
      queries.forEach((query) => dispatch(stopWatchPrometheusQuery(query)));
    };
  }, [dispatch, queries]);

  const selectors = React.useMemo(
    () => queries.map((q) => ({ dashboards }) => dashboards.getIn([RESULTS_TYPE.PROMETHEUS, q])),
    [queries],
  );

  const querySelector = React.useMemo(() => customSelectorCreator(selectors, (...data) => data), [
    selectors,
  ]);

  const queryResults = useSelector<RootState, ImmutableMap<string, any>>(querySelector);

  const results = React.useMemo<UsePrometheusQueriesResult>(() => {
    if (_.isEmpty(queryResults?.[0])) {
      return queries.map(() => [null, true, null]) as UsePrometheusQueriesResult;
    }
    return queryResults.reduce((acc, curr) => {
      const data = curr.get('data');
      const value = getInstantVectorStats(curr.get('data'), metric);
      return [...acc, [value, !data, curr.get('loadError')]];
    }, []);
  }, [queryResults, metric, queries]);

  return results;
};

type UsePrometheusQuery = (query: string, humanize: Humanize) => [HumanizeResult, any, number];
type UsePrometheusQueries = (queries: string[], metric?: string) => UsePrometheusQueriesResult;
type UsePrometheusQueriesResult = [DataPoint[], boolean, any][];
