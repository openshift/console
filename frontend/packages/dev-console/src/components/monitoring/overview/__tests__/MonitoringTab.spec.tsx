/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import MonitoringTab from '../MonitoringTab';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/utils', () => ({
  Firehose: function MockFirehose(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'firehose',
        'data-resources': JSON.stringify(props.resources),
      },
      props.children,
    );
  },
}));

jest.mock('@console/internal/models', () => ({
  PodModel: { kind: 'Pod' },
}));

jest.mock('@console/internal/module/k8s', () => ({
  PodKind: {},
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  getReferenceForModel: jest.fn(
    (model) => `${model.apiGroup || 'core'}~${model.apiVersion}~${model.kind}`,
  ),
  getReference: jest.fn((ref) => `${ref.group || 'core'}~${ref.version}~${ref.kind}`),
  K8sModel: {},
}));

jest.mock('../MonitoringOverview', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockMonitoringOverview(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'monitoring-overview',
          'data-resource': JSON.stringify(props.resource),
          'data-pods': JSON.stringify(props.pods),
          'data-monitoring-alerts': JSON.stringify(props.monitoringAlerts),
        },
        'Monitoring Overview Component',
      );
    },
  };
});

jest.mock('@console/shared', () => ({
  usePodsWatcher: () => ({
    loaded: true,
    loadError: '',
    podData: {},
  }),
  OverviewItem: {},
}));

describe('Monitoring Tab', () => {
  const monTabProps: React.ComponentProps<typeof MonitoringTab> = {
    item: {
      obj: {
        metadata: {
          name: 'workload-name',
          namespace: 'test',
        },
        kind: 'Deployment',
        status: {},
        spec: {
          selector: {},
          template: {
            metadata: {},
            spec: {
              containers: [],
            },
          },
        },
      },
    },
  };

  it('should render Monitoring tab with Metrics section for selected workload', () => {
    render(<MonitoringTab {...monTabProps} />);

    expect(screen.getByTestId('monitoring-overview')).toBeInTheDocument();
  });
});
