import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import {
  RequestMap,
  UseDashboardResources,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import {
  stopWatchPrometheusQuery,
  stopWatchURL,
  watchPrometheusQuery,
  watchURL,
} from '@console/internal/actions/dashboards';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboards';
import { useNotificationAlerts } from './useNotificationAlerts';

export const useDashboardResources: UseDashboardResources = ({
  prometheusQueries,
  urls,
  notificationAlertLabelSelectors,
}) => {
  const [alerts, alertsLoaded, alertsLoadError] = useNotificationAlerts(
    notificationAlertLabelSelectors,
  );

  const dispatch = useDispatch();
  React.useEffect(() => {
    prometheusQueries?.forEach((query) =>
      dispatch(watchPrometheusQuery(query.query, null, query.timespan)),
    );
    urls?.forEach((url) => dispatch(watchURL(url?.url)));

    return () => {
      prometheusQueries?.forEach((query) => {
        dispatch(stopWatchPrometheusQuery(query.query, query.timespan));
      });
      urls?.forEach((url) => dispatch(stopWatchURL(url?.url)));
    };
  }, [dispatch, prometheusQueries, urls]);

  const urlResults = useSelector((state) => state.dashboards.get(RESULTS_TYPE.URL));
  const prometheusResults = useSelector(
    (state) => state.dashboards.get(RESULTS_TYPE.PROMETHEUS) as RequestMap<PrometheusResponse>,
  );

  return {
    urlResults,
    prometheusResults,
    notificationAlerts: {
      alerts,
      loaded: alertsLoaded,
      loadError: alertsLoadError,
    },
  };
};
