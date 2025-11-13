import { useEffect, useMemo } from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useSelector, useDispatch } from 'react-redux';
import {
  watchPrometheusQuery,
  stopWatchPrometheusQuery,
} from '@console/internal/actions/dashboards';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { Humanize, HumanizeResult } from '@console/internal/components/utils/types';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboard-results';
import { RootState } from '@console/internal/redux';

/** @deprecated use usePrometheusPoll() instead */
export const usePrometheusQuery: UsePrometheusQuery = (query, humanize) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(watchPrometheusQuery(query));
    return () => {
      dispatch(stopWatchPrometheusQuery(query));
    };
  }, [dispatch, query]);

  const queryResult = useSelector<RootState, ImmutableMap<string, any>>(({ dashboards }) =>
    dashboards.getIn([RESULTS_TYPE.PROMETHEUS, query]),
  );
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
