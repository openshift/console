import * as React from 'react';
import { Table, TableHeader, TableBody } from '@patternfly/react-table';
import { shallow } from 'enzyme';
import { Map } from 'immutable';
import * as redux from 'react-redux';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';
import * as prometheusHook from '@console/internal/components/graphs/prometheus-rules-hook';
import { EmptyBox } from '@console/internal/components/utils';
import { MonitoringAlerts } from '../MonitoringAlerts';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

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
    filters: Map({}),
    listSorts: Map({}),
  };
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const spySelector = jest.spyOn(redux, 'useSelector');
  spySelector.mockReturnValue({ monitoring: { devRules: [] } });
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const spyDispatch = jest.spyOn(redux, 'useDispatch');
  spyDispatch.mockReturnValue(() => {});

  it('should render monitoring alerts', () => {
    const spyPrometheusRulesPoll = jest.spyOn(prometheusHook, 'usePrometheusRulesPoll');
    spyPrometheusRulesPoll.mockReturnValueOnce([
      {
        data: {
          groups: [
            {
              name: 'kubernetes.rules',
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
                      state: 'firing',
                    },
                  ],
                  annotations: {
                    message:
                      'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
                  },
                  labels: { prometheus: 'openshift-monitoring/k8s', severity: 'warning' },
                  name: 'AlertmanagerReceiversNotConfigured',
                  query: 'cluster:alertmanager_routing_enabled:max == 0',
                  state: 'firing',
                  type: 'alerting',
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
                  state: 'inactive',
                  type: 'alerting',
                },
              ],
            },
          ],
        },
      },
      null,
      false,
    ]);
    const wrapper = shallow(<MonitoringAlerts {...monitoringAlertsProps} />);
    expect(wrapper.find(FilterToolbar).exists()).toBe(true);
    expect(wrapper.find(Table).exists()).toBe(true);
    expect(wrapper.find(TableHeader).exists()).toBe(true);
    expect(wrapper.find(TableBody).exists()).toBe(true);
  });
  it('should show empty state message', () => {
    const spyPrometheusRulesPoll = jest.spyOn(prometheusHook, 'usePrometheusRulesPoll');
    spyPrometheusRulesPoll.mockReturnValueOnce([{}, null, false]);
    const wrapper = shallow(<MonitoringAlerts {...monitoringAlertsProps} />);
    expect(wrapper.find(EmptyBox).exists()).toBe(true);
  });
});
