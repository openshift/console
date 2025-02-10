import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch } from 'react-redux';
import { Alert } from '@console/dynamic-plugin-sdk';
import { PrometheusRulesResponse } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
  setAlertCount,
} from '@console/internal/actions/observe';
import { coFetchJSON } from '@console/internal/co-fetch';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  getAlertsAndRules,
  silenceMatcherEqualitySymbol,
} from '@console/internal/components/monitoring/utils';
import {
  getAlertName,
  getAlertTime,
} from '@console/shared/src/components/dashboard/status-card/alert-utils';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';

/** Fetches notification alerts from redux store and updates the notification count.
 * Polls the Prometheus and Alertmanager for notification alerts AND silences, stores the
 * results into redux, adjusts the API polling frequency based on the poll success.
  @returns Nothing, its a side-effect-driven hook.
*/
export const useNotificationPoller = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [alerts, ,] = useNotificationAlerts();

  // Update alert count.
  const alertCount = alerts?.length ?? 0;
  React.useEffect(() => {
    dispatch(setAlertCount(alertCount));
  }, [alertCount, dispatch]);

  React.useEffect(() => {
    const pollerTimeouts = {};
    const pollers = {};

    const poll: NotificationPoll = (url, key: 'notificationAlerts' | 'silences', dataHandler) => {
      dispatch(alertingLoading(key));
      const notificationPoller = (): void => {
        coFetchJSON(url)
          .then((response) => dataHandler(response))
          .then((data) => {
            dispatch(alertingLoaded(key, data));
            pollerTimeouts[key] = setTimeout(notificationPoller, 15 * 1000);
          })
          .catch((e) => {
            dispatch(alertingErrored(key, e));

            // If the API returned an error, poll less frequently to avoid excessive calls. For
            // example, if the user doesn't have permission to access the API, polling will probably
            // continue to fail, but it is possible that permissions will be granted so we don't
            // stop completely.
            pollerTimeouts[key] = setTimeout(notificationPoller, 60 * 1000);
          });
      };
      pollers[key] = notificationPoller;
      notificationPoller();
    };

    const { alertManagerBaseURL, prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      poll(
        `${prometheusBaseURL}/${PrometheusEndpoint.RULES}`,
        'notificationAlerts',
        (alertsResults: PrometheusRulesResponse): Alert[] =>
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
      );
    } else {
      dispatch(
        alertingErrored('notificationAlerts', new Error(t('public~prometheusBaseURL not set'))),
      );
    }

    if (alertManagerBaseURL) {
      poll(`${alertManagerBaseURL}/api/v2/silences`, 'silences', (silences) => {
        // Set a name field on the Silence to make things easier
        _.each(silences, (s) => {
          s.name = _.get(_.find(s.matchers, { name: 'alertname' }), 'value');
          if (!s.name) {
            // No alertname, so fall back to displaying the other matchers
            s.name = s.matchers
              .map(
                (m) => `${m.name}${silenceMatcherEqualitySymbol(m.isEqual, m.isRegex)}${m.value}`,
              )
              .join(', ');
          }
        });
        return silences;
      });
    } else {
      dispatch(alertingErrored('silences', new Error(t('public~alertManagerBaseURL not set'))));
    }

    return () => _.each(pollerTimeouts, clearTimeout);
  }, [dispatch, t]);
};

type NotificationPoll = (
  url: string,
  key: 'notificationAlerts' | 'silences',
  dataHandler: (data) => any,
) => void;
