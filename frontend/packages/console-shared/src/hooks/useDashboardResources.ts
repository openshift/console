import { useEffect } from 'react';
import { useConsoleDispatch, useConsoleSelector } from '@console/app/src/hooks/redux';
import { UseDashboardResources } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import {
  stopWatchPrometheusQuery,
  stopWatchURL,
  watchPrometheusQuery,
  watchURL,
} from '@console/internal/actions/dashboards';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboard-results';
import { useNotificationAlerts } from './useNotificationAlerts';

export const useDashboardResources: UseDashboardResources = ({
  prometheusQueries,
  urls,
  notificationAlertLabelSelectors,
}) => {
  const [alerts, alertsLoaded, alertsLoadError] = useNotificationAlerts(
    notificationAlertLabelSelectors,
  );

  const dispatch = useConsoleDispatch();
  useEffect(() => {
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

  const urlResults = useConsoleSelector((state) => state.dashboards.get(RESULTS_TYPE.URL));
  const prometheusResults = useConsoleSelector((state) =>
    state.dashboards.get(RESULTS_TYPE.PROMETHEUS),
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
