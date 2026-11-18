import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import type { NotificationAlerts } from '@console/internal/reducers/observe';
import {
  getAlertName,
  getAlertTime,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';

export const useNamespacedNotificationAlertsPoller = (namespace: string) => {
  const { t } = useTranslation('console-app');
  const [alerts, setAlerts] = useState<NotificationAlerts['data']>([]);
  const [loaded, setLoaded] = useState<NotificationAlerts['loaded']>(false);
  // The Prometheus base URL is static for the lifetime of the app, so the
  // missing-URL error is computed once up front.
  const [loadError, setLoadError] = useState<NotificationAlerts['loadError']>(() =>
    window.SERVER_FLAGS.prometheusTenancyBaseURL ? null : new Error(t('prometheusBaseURL not set')),
  );

  useEffect(() => {
    const { prometheusTenancyBaseURL } = window.SERVER_FLAGS;

    if (!prometheusTenancyBaseURL) {
      return () => {};
    }

    let pollTimeout: NodeJS.Timeout;

    const poll = () => {
      setLoaded(false);
      coFetchJSON(`${prometheusTenancyBaseURL}/${PrometheusEndpoint.RULES}?namespace=${namespace}`)
        .then((alertsResults) =>
          alertsResults
            ? getAlertsAndRules(alertsResults.data)
                .alerts.filter(
                  (a) =>
                    a.state === 'firing' &&
                    getAlertName(a) !== 'Watchdog' &&
                    getAlertName(a) !== 'UpdateAvailable',
                )
                .sort((a, b) => +new Date(getAlertTime(b)) - +new Date(getAlertTime(a)))
            : [],
        )
        .then((data) => {
          setAlerts(data);
          pollTimeout = setTimeout(poll, 15 * 1000);
        })
        .finally(() => {
          setLoaded(true);
        })
        .catch((e) => {
          setLoadError(e);
          pollTimeout = setTimeout(poll, 60 * 1000);
        });
    };

    poll();

    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
    // `t` is intentionally not a dependency: it is only used by the
    // loadError initializer above, and a language change must not restart
    // the alert polling.
  }, [namespace]);

  return {
    alerts,
    loaded,
    loadError,
  };
};
