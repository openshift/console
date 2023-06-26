import * as React from 'react';
import * as _ from 'lodash';
import { Dispatch } from 'redux';
import { PrometheusRulesResponse } from '@console/dynamic-plugin-sdk';
import {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
  alertingSetRules,
} from '@console/internal/actions/observe';
import { getPrometheusURL, PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { fetchAlerts } from '@console/internal/components/monitoring/fetch-alerts';
import {
  alertingRuleStateOrder,
  getAlertsAndRules,
} from '@console/internal/components/monitoring/utils';

const RULES_POLL_DELAY = 15000; // 15 seconds
let pollerTimeout: null | NodeJS.Timeout = null;

export const useRulesAlertsPoller = (
  namespace: string,
  dispatch: Dispatch,
  alertsSource: {
    id: string;
    getAlertingRules: (namespace?: string) => Promise<PrometheusRulesResponse>;
  }[],
) => {
  React.useEffect(() => {
    const url = getPrometheusURL({
      endpoint: PrometheusEndpoint.RULES,
      namespace,
    });
    dispatch(alertingLoading('alerts', 'dev'));

    const poller = (): void => {
      fetchAlerts(url, alertsSource, namespace)
        .then(({ data }) => {
          const { alerts: fetchedAlerts, rules: fetchedRules } = getAlertsAndRules(data);
          const sortThanosRules = _.sortBy(fetchedRules, alertingRuleStateOrder);
          dispatch(alertingSetRules('devRules', sortThanosRules, 'dev'));
          dispatch(alertingLoaded('devAlerts', fetchedAlerts, 'dev'));
        })
        .then(() => {
          if (pollerTimeout) {
            clearTimeout(pollerTimeout);
          }
          pollerTimeout = setTimeout(poller, RULES_POLL_DELAY);
        })
        .catch((e) => dispatch(alertingErrored('devAlerts', e)));
    };

    poller();

    return () => {
      if (pollerTimeout) {
        clearTimeout(pollerTimeout);
      }
    };
  }, [namespace, alertsSource, dispatch]);
};
