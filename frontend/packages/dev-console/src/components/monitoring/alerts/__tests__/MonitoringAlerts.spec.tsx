import * as React from 'react';
import { Table, TableHeader, TableBody } from '@patternfly/react-table';
import { shallow } from 'enzyme';
import { Map } from 'immutable';
import * as redux from 'react-redux';
import { AlertStates, PrometheusRulesResponse, RuleStates } from '@console/dynamic-plugin-sdk/src';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { EmptyBox } from '@console/internal/components/utils';
import { MonitoringAlerts } from '../MonitoringAlerts';

describe('MonitoringAlerts', () => {
  const monitoringAlertsProps: React.ComponentProps<typeof MonitoringAlerts> = {
    match: {
      params: {
        ns: 'monitoring-test',
      },
      isExact: true,
      path: '',
      url: '',
    },
    rules: [],
    alerts: { data: [], loaded: false },
    filters: Map({}),
    listSorts: Map({}),
  };
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const spySelector = jest.spyOn(redux, 'useSelector');
  spySelector.mockReturnValue({ monitoring: { devRules: [] } });
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const spyDispatch = jest.spyOn(redux, 'useDispatch');
  spyDispatch.mockReturnValue(() => {});

  it('should render monitoring alerts', () => {
    const mockData: PrometheusRulesResponse['data'] = {
      groups: [
        {
          name: 'kubernetes.rules',
          file: 'my-rules-file',
          rules: [
            {
              alerts: [
                {
                  annotations: {
                    message:
                      'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
                  },
                  labels: {
                    alertname: 'AlertmanagerReceiversNotConfigured',
                    severity: 'warning',
                  },
                  state: 'firing' as AlertStates,
                },
              ],
              annotations: {
                message:
                  'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
              },
              labels: { prometheus: 'openshift-monitoring/k8s', severity: 'warning' },
              name: 'AlertmanagerReceiversNotConfigured',
              query: 'cluster:alertmanager_routing_enabled:max == 0',
              state: 'firing' as RuleStates,
              type: 'alerting',
              duration: 10,
            },
            {
              alerts: [],
              annotations: {
                message:
                  'Cluster Monitoring Operator is experiencing reconciliation error rate of {{ printf "%0.0f" $value }}%.',
              },
              labels: { prometheus: 'openshift-monitoring/k8s', severity: 'warning' },
              name: 'ClusterMonitoringOperatorReconciliationErrors',
              query:
                'rate(cluster_monitoring_operator_reconcile_errors_total[15m]) * 100 / rate(cluster_monitoring_operator_reconcile_attempts_total[15m]) > 10',
              state: 'inactive' as RuleStates,
              type: 'alerting',
              duration: 10,
            },
          ],
        },
      ],
    };
    const { alerts, rules } = getAlertsAndRules(mockData);

    const propsWithAlertsAndRules = {
      ...monitoringAlertsProps,
      rules,
      alerts: {
        data: alerts,
        loaded: true,
      },
    };

    const wrapper = shallow(<MonitoringAlerts {...propsWithAlertsAndRules} />);
    expect(wrapper.find(FilterToolbar).exists()).toBe(true);
    expect(wrapper.find(Table).exists()).toBe(true);
    expect(wrapper.find(TableHeader).exists()).toBe(true);
    expect(wrapper.find(TableBody).exists()).toBe(true);
  });
  it('should show empty state message', () => {
    const propsWithEmptyRules = {
      ...monitoringAlertsProps,
      rules: [],
      alerts: {
        loaded: true,
        data: [],
      },
    };
    const wrapper = shallow(<MonitoringAlerts {...propsWithEmptyRules} />);

    expect(wrapper.find(EmptyBox).exists()).toBe(true);
  });
});
