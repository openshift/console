import { Alert } from '@console/internal/components/monitoring/types';
import { AlertStates, RuleStates } from '@console/internal/reducers/monitoring';

export const alertItems: Alert[] = [
  {
    activeAt: '2020-06-29T14:10:36.662770393Z',
    annotations: {
      message:
        'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
    },
    labels: {
      alertname: 'AlertmanagerReceiversNotConfigured',
      severity: 'warning',
    },
    rule: {
      alerts: [
        {
          activeAt: '2020-06-29T14:10:36.662770393Z',
          annotations: {
            message:
              'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
          },
          labels: {
            alertname: 'AlertmanagerReceiversNotConfigured',
            severity: 'warning',
          },
          state: AlertStates.Firing,
          value: 0,
        },
      ],
      annotations: {
        message:
          'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
      },
      duration: 600,
      id: '3695674300',
      labels: {
        severity: 'warning',
      },
      name: 'AlertmanagerReceiversNotConfigured',
      query: 'cluster:alertmanager_routing_enabled:max == 0',
      state: RuleStates.Firing,
      type: 'warning',
    },
    silencedBy: [],
    state: AlertStates.Firing,
    value: 0,
  },
  {
    activeAt: '2020-06-29T14:10:36.662770393Z',
    annotations: {
      message:
        'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
    },
    labels: {
      alertname: 'AlertmanagerReceiversNotConfigured',
      severity: 'warning',
    },
    rule: {
      alerts: [
        {
          activeAt: '2020-06-29T14:10:36.662770393Z',
          annotations: {
            message:
              'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
          },
          labels: {
            alertname: 'AlertmanagerReceiversNotConfigured',
            severity: 'warning',
          },
          state: AlertStates.Firing,
          value: 0,
        },
      ],
      annotations: {
        message:
          'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
      },
      duration: 600,
      id: '3695674300',
      labels: {
        severity: 'warning',
      },
      name: 'AlertmanagerReceiversNotConfigured',
      query: 'cluster:alertmanager_routing_enabled:max == 0',
      state: RuleStates.Firing,
      type: 'warning',
    },
    silencedBy: [],
    state: AlertStates.Firing,
    value: 0,
  },
  {
    activeAt: '2020-06-29T14:10:36.662770393Z',
    annotations: {
      message:
        'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
    },
    labels: {
      alertname: 'AlertmanagerReceiversNotConfigured',
      severity: 'warning',
    },
    rule: {
      alerts: [
        {
          activeAt: '2020-06-29T14:10:36.662770393Z',
          annotations: {
            message:
              'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
          },
          labels: {
            alertname: 'AlertmanagerReceiversNotConfigured',
            severity: 'warning',
          },
          state: AlertStates.Firing,
          value: 0,
        },
      ],
      annotations: {
        message:
          'Alerts are not configured to be sent to a notification system, meaning that you may not be notified in a timely fashion when important failures occur. Check the OpenShift documentation to learn how to configure notifications with Alertmanager.',
      },
      duration: 600,
      id: '3695674300',
      labels: {
        severity: 'warning',
      },
      name: 'AlertmanagerReceiversNotConfigured',
      query: 'cluster:alertmanager_routing_enabled:max == 0',
      state: RuleStates.Firing,
      type: 'warning',
    },
    silencedBy: [],
    state: AlertStates.Firing,
    value: 0,
  },
];
