import { useEffect, useMemo } from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useConsoleDispatch, useConsoleSelector } from '@console/app/src/hooks/redux';
import {
  watchPrometheusQuery,
  stopWatchPrometheusQuery,
} from '@console/internal/actions/dashboards';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { Humanize, HumanizeResult } from '@console/internal/components/utils/types';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboard-results';

/** @deprecated use usePrometheusPoll() instead */
export const usePrometheusQuery: UsePrometheusQuery = (query, humanize) => {
  const dispatch = useConsoleDispatch();
  useEffect(() => {
    dispatch(watchPrometheusQuery(query));
    return () => {
      dispatch(stopWatchPrometheusQuery(query));
    };
  }, [dispatch, query]);

  const queryResult = useConsoleSelector(({ dashboards }) =>
    dashboards.getIn([RESULTS_TYPE.PROMETHEUS, query]),
  ) as ImmutableMap<string, any>;
  const results = useMemo<[HumanizeResult, any, number]>(() => {
    if (!queryResult || !queryResult.get('data')) {
      return [{}, null, null] as [HumanizeResult, any, number];
    }
    const value = getInstantVectorStats(queryResult.get('data'))[0]?.y;
    return [humanize(value), queryResult.get('loadError'), value];
  }, [queryResult, humanize]);

  return results;
};

type UsePrometheusQuery = (query: string, humanize: Humanize) => [HumanizeResult, any, number];
