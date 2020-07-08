import * as _ from 'lodash-es';
import { murmur3 } from 'murmurhash-js';

import { RootState } from '../../redux';
import { PrometheusLabels } from '../graphs';
import {
  Alert,
  Alerts,
  MonitoringResource,
  PrometheusRule,
  PrometheusRulesResponse,
  Rule,
  Silences,
} from './types';

export const AlertResource: MonitoringResource = {
  kind: 'Alert',
  label: 'Alert',
  plural: '/monitoring/alerts',
  abbr: 'AL',
};

export const RuleResource: MonitoringResource = {
  kind: 'AlertRule',
  label: 'Alerting Rule',
  plural: '/monitoring/alertrules',
  abbr: 'AR',
};

export const SilenceResource: MonitoringResource = {
  kind: 'Silence',
  label: 'Silence',
  plural: '/monitoring/silences',
  abbr: 'SL',
};

export const labelsToParams = (labels: PrometheusLabels) =>
  _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

export const alertURL = (alert: Alert, ruleID: string) =>
  `${AlertResource.plural}/${ruleID}?${labelsToParams(alert.labels)}`;

export const getAlertsAndRules = (
  data: PrometheusRulesResponse['data'],
): { alerts: Alert[]; rules: Rule[] } => {
  // Flatten the rules data to make it easier to work with, discard non-alerting rules since those
  // are the only ones we will be using and add a unique ID to each rule.
  const groups = _.get(data, 'groups') as PrometheusRulesResponse['data']['groups'];
  const rules = _.flatMap(groups, (g) => {
    const addID = (r: PrometheusRule): Rule => {
      const key = [
        g.file,
        g.name,
        r.name,
        r.duration,
        r.query,
        ..._.map(r.labels, (k, v) => `${k}=${v}`),
      ].join(',');
      return { ...r, id: String(murmur3(key, 'monitoring-salt')) };
    };

    return _.filter(g.rules, { type: 'alerting' }).map(addID);
  });

  // Add `rule` object to each alert
  const alerts = _.flatMap(rules, (rule) => rule.alerts.map((a) => ({ rule, ...a })));

  return { alerts, rules };
};

export const alertsToProps = ({ UI }) => UI.getIn(['monitoring', 'alerts']) || {};

export const rulesToProps = (state: RootState) => {
  const data = state.UI.getIn(['monitoring', 'rules']);
  const { loaded, loadError }: Alerts = alertsToProps(state);
  return { data, loaded, loadError };
};

export const silencesToProps = ({ UI }) => UI.getIn(['monitoring', 'silences']) || {};

export const silenceParamToProps = (state: RootState, { match }) => {
  const { data: silences, loaded, loadError }: Silences = silencesToProps(state);
  const { loaded: alertsLoaded }: Alerts = alertsToProps(state);
  const silence = _.find(silences, { id: _.get(match, 'params.id') });
  return { alertsLoaded, loaded, loadError, silence, silences };
};
