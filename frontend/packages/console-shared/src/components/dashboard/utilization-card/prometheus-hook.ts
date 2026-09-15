import { useEffect, useMemo } from 'react';
import {
  watchPrometheusQuery,
  stopWatchPrometheusQuery,
} from '@console/internal/actions/dashboards';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import type { Humanize, HumanizeResult } from '@console/internal/components/utils/types';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboard-results';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

/** @deprecated use usePrometheusPoll() instead */
export const usePrometheusQuery: UsePrometheusQuery = (query, humanize) => {
  const dispatch = useConsoleDispatch();
  useEffect(() => {
    dispatch(watchPrometheusQuery(query));
    return () => {
      dispatch(stopWatchPrometheusQuery(query));
    };
  }, [dispatch, query]);

  const queryResult = useConsoleSelector(
    ({ dashboards }) => dashboards[RESULTS_TYPE.PROMETHEUS]?.[query],
  );
  const results = useMemo<[HumanizeResult, any, number]>(() => {
    if (!queryResult || !queryResult.data) {
      return [{}, null, null] as [HumanizeResult, any, number];
    }
    const value = getInstantVectorStats(queryResult.data)[0]?.y;
    return [humanize(value), queryResult.loadError, value];
  }, [queryResult, humanize]);

  return results;
};

type UsePrometheusQuery = (query: string, humanize: Humanize) => [HumanizeResult, any, number];
