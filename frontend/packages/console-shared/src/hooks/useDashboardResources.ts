import { useEffect } from 'react';
import type { UseDashboardResources } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import {
  stopWatchPrometheusQuery,
  stopWatchURL,
  watchPrometheusQuery,
  watchURL,
} from '@console/internal/actions/dashboards';
import { RESULTS_TYPE } from '@console/internal/reducers/dashboard-results';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
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
    urls?.forEach((url) => dispatch(watchURL(url?.url, url?.fetch)));

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
