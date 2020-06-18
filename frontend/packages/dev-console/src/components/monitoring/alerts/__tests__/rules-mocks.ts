import { PrometheusRulesResponse } from '@console/internal/components/monitoring/types';
import { RuleStates, AlertStates } from '@console/internal/reducers/monitoring';

/* eslint-disable @typescript-eslint/camelcase */
export const rules: PrometheusRulesResponse = {
  status: 'success',
  data: {
    groups: [
      {
        name: 'kubernetes-system-kubelet',
        file:
          '/etc/prometheus/rules/prometheus-k8s-rulefiles-0/openshift-monitoring-prometheus-k8s-rules.yaml',
        rules: [
          {
            state: RuleStates.Firing,
            name: 'KubeNodeNotReady',
            query:
              'kube_node_status_condition{condition="Ready",job="kube-state-metrics",status="true"} == 0',
            duration: 900,
            labels: {
              prometheus: 'openshift-monitoring/k8s',
              severity: 'warning',
            },
            annotations: {
              message: '{{ $labels.node }} has been unready for more than 15 minutes.',
            },
            alerts: [
              {
                labels: {
                  alertname: 'KubeNodeNotReady',
                  severity: 'warning',
                },
                annotations: {
                  message:
                    'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
                },
                state: AlertStates.Firing,
                activeAt: '2020-06-09T04:06:36.662770393Z',
                value: '0e+00',
              },
              {
                labels: {
                  alertname: 'KubeNodeNotReady-1',
                  severity: 'warning',
                },
                annotations: {
                  message:
                    'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
                },
                state: AlertStates.Pending,
                activeAt: '2020-06-09T04:06:36.662770393Z',
                value: '0e+00',
              },
            ],
            type: 'alerting',
          },
          {
            state: RuleStates.Firing,
            name: 'KubeNodeReadinessFlapping',
            query:
              'sum by(node) (changes(kube_node_status_condition{condition="Ready",status="true"}[15m])) > 2',
            duration: 900,
            labels: {
              prometheus: 'openshift-monitoring/k8s',
              severity: 'warning',
            },
            annotations: {
              message: 'Pod {{ $labels.pod }} has been in waiting state for longer than 1 hour.',
            },
            alerts: [
              {
                labels: {
                  alertname: 'VersionAlert',
                  endpoint: 'web',
                  instance: '10.131.0.26:8080',
                  job: 'prometheus-example-app',
                  namespace: 'ns1',
                  pod: 'prometheus-example-app-57d8c46fb9-k2x7k',
                  prometheus: 'openshift-user-workload-monitoring/user-workload',
                  service: 'prometheus-example-app',
                  version: 'v0.1.0',
                },
                annotations: {
                  message:
                    'Pod prometheus-example-app-57d8c46fb9-k2x7k has been in waiting state for longer than 1 hour.',
                },
                state: AlertStates.Firing,
                activeAt: '2020-06-17T08:50:15.389025513Z',
                value: '0e+00',
              },
            ],
            type: 'alerting',
          },
          {
            state: RuleStates.Inactive,
            name: 'KubeNodeUnreachable',
            query:
              'kube_node_spec_taint{effect="NoSchedule",job="kube-state-metrics",key="node.kubernetes.io/unreachable"} == 1',
            duration: 120,
            labels: {
              prometheus: 'openshift-monitoring/k8s',
              severity: 'warning',
            },
            annotations: {
              message: '{{ $labels.node }} is unreachable and some workloads may be rescheduled.',
            },
            alerts: [],
            type: 'alerting',
          },
        ],
      },
    ],
  },
};
