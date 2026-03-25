import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { coFetchJSON } from '@console/internal/co-fetch';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import {
  getAlertName,
  getAlertTime,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import type { NotificationAlerts } from 'public/reducers/observe';

export const useNamespacedNotificationAlertsPoller = (namespace: string) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<NotificationAlerts['data']>([]);
  const [loaded, setLoaded] = useState<NotificationAlerts['loaded']>(false);
  const [loadError, setLoadError] = useState<NotificationAlerts['loadError']>(null);

  useEffect(() => {
    const { prometheusTenancyBaseURL } = window.SERVER_FLAGS;

    if (!prometheusTenancyBaseURL) {
      setLoadError(new Error(t('public~prometheusBaseURL not set')));
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
  }, [namespace, t]);

  return {
    alerts,
    loaded,
    loadError,
  };
};
