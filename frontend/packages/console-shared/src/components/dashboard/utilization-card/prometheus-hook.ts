import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import {
  watchPrometheusQuery,
  stopWatchPrometheusQuery,
} from '@console/internal/actions/dashboards';
import { RootState, RESULTS_TYPE } from '@console/internal/redux-types';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
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

type UsePrometheusQuery = (query: string, humanize: Humanize) => [HumanizeResult, any, number];
