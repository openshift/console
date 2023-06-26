import { Rule, PrometheusRulesResponse } from '../api/common-types';
import { CodeRef, Extension, ExtensionDeclaration } from '../types';

type AlertingRulesFetch = (namespace?: string) => Promise<PrometheusRulesResponse>;

/** Alerting rules from additional sources other than Prometheus */
export type AlertingRulesSourceExtension = ExtensionDeclaration<
  'console.alerts/rules-source',
  {
    /** Id of the alerting rules source */
    id: string;
    /** ContextId on which this source of alerting rules should be used */
    contextId: string;
    /** Promise that returns Prometheus-compatible alerting rules */
    getAlertingRules: CodeRef<AlertingRulesFetch>;
  }
>;

type AlertingRuleChartProps = { rule?: Rule };

/** Metric charts for alerting rules from additional sources other than Prometheus */
export type AlertingRuleChartExtension = ExtensionDeclaration<
  'console.alerts/rules-chart',
  {
    /** Source Id belonging to one 'console.alerts/rules-source' used to fetch alerting rule metrics */
    sourceId: string;
    /** Chart component to be rendered as alerting rule metrics */
    chart: CodeRef<React.ComponentType<AlertingRuleChartProps>>;
  }
>;

// Type guards

export const isAlertingRulesSource = (e: Extension): e is AlertingRulesSourceExtension =>
  e.type === 'console.alerts/rules-source';

export const isAlertingRuleChart = (e: Extension): e is AlertingRuleChartExtension =>
  e.type === 'console.alerts/rules-chart';
