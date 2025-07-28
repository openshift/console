/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen, fireEvent } from '@testing-library/react';
import { AlertStates } from '@console/dynamic-plugin-sdk';
import { mockAlerts } from '@console/shared/src/utils/__mocks__/alerts-and-rules-data';
import MonitoringOverview from '../MonitoringOverview';
import { mockPodEvents, mockResourceEvents, mockPods } from './mockData';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@patternfly/react-core', () => ({
  Accordion: function MockAccordion(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'accordion',
      },
      props.children,
    );
  },
  AccordionItem: function MockAccordionItem(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'accordion-item',
        'data-is-expanded': props.isExpanded,
        'data-id': props.id,
        id: props.id,
      },
      props.children,
    );
  },
  AccordionToggle: function MockAccordionToggle(props) {
    const React = require('react');
    return React.createElement(
      'button',
      {
        'data-test': 'accordion-toggle',
        'data-id': props.id,
        id: props.id,
        type: 'button',
        onClick: props.onClick,
      },
      props.children,
    );
  },
  AccordionContent: function MockAccordionContent(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'accordion-content',
        'data-id': props.id,
        id: props.id,
      },
      props.children,
    );
  },
  Badge: function MockBadge(props) {
    const React = require('react');
    return React.createElement(
      'span',
      {
        'data-test': 'badge',
      },
      props.children,
    );
  },
  Split: function MockSplit(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'split',
      },
      props.children,
    );
  },
  SplitItem: function MockSplitItem(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'split-item',
        'data-is-filled': props.isFilled,
      },
      props.children,
    );
  },
  EmptyState: function MockEmptyState(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'empty-state',
      },
      props.children,
    );
  },
  EmptyStateBody: function MockEmptyStateBody(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'empty-state-body',
      },
      props.children,
    );
  },
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: function MockLoadingBox() {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'loading-box',
      },
      'Loading...',
    );
  },
}));

jest.mock('@console/internal/components/events', () => ({
  sortEvents: jest.fn((events) => events),
}));

jest.mock('../MonitoringMetrics', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockWorkloadGraphs(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'workload-graphs',
          'data-resource': JSON.stringify(props.resource),
        },
        'Workload Graphs',
      );
    },
  };
});

jest.mock('../MonitoringOverviewAlerts', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockMonitoringOverviewAlerts(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'monitoring-overview-alerts',
          'data-alerts': JSON.stringify(props.alerts),
        },
        'Monitoring Overview Alerts',
      );
    },
  };
});

jest.mock('../MonitoringOverviewEvents', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockMonitoringOverviewEvents(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'monitoring-overview-events',
          'data-events': JSON.stringify(props.events),
        },
        'Monitoring Overview Events',
      );
    },
  };
});

jest.mock('react-router-dom-v5-compat', () => ({
  Link: function MockLink(props) {
    const React = require('react');
    return React.createElement(
      'a',
      {
        'data-test': 'link',
        'data-to': props.to,
        href: props.to,
        'data-test-id': props['data-test'],
      },
      props.children,
    );
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Alerts') return 'Alerts';
      if (key === 'devconsole~Metrics') return 'Metrics';
      if (key === 'devconsole~All events') return 'All events';
      if (key === 'devconsole~View dashboards') return 'View dashboards';
      if (key === 'devconsole~No metrics found') return 'No metrics found';
      if (key === 'devconsole~Deployment Configuration metrics are not yet supported.') {
        return 'Deployment Configuration metrics are not yet supported.';
      }
      return key;
    },
  }),
}));

jest.mock('@console/shared', () => ({
  getFiringAlerts: jest.fn((alerts) => alerts.filter((alert) => alert.state === 'firing')),
}));

jest.mock('@console/internal/models', () => ({
  DeploymentConfigModel: { kind: 'DeploymentConfig' },
}));

jest.mock('@patternfly/react-icons/dist/esm/icons/info-circle-icon', () => ({
  InfoCircleIcon: function MockInfoCircleIcon() {
    const React = require('react');
    return React.createElement('span', { 'data-test': 'info-circle-icon' }, 'Info');
  },
}));

describe('Monitoring Metric Section', () => {
  const monitoringOverviewProps: React.ComponentProps<typeof MonitoringOverview> = {
    resource: {
      metadata: {
        name: 'workload-name',
        namespace: 'test',
      },
      spec: {},
      status: {},
      kind: 'Deployment',
    },
    pods: mockPods,
    resourceEvents: mockResourceEvents,
    monitoringAlerts: mockAlerts.data,
    ...mockPodEvents,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('metrics accordion should be expanded by default', () => {
    render(<MonitoringOverview {...monitoringOverviewProps} />);

    const metricsAccordion = document.getElementById('metrics-accordian-item');
    expect(metricsAccordion).toHaveAttribute('data-is-expanded', 'true');
  });

  it('alerts accordion should expanded by default if there are firing alerts', () => {
    render(<MonitoringOverview {...monitoringOverviewProps} />);

    const alertsAccordion = document.getElementById('monitoring-alerts-accordian-item');
    expect(alertsAccordion).toHaveAttribute('data-is-expanded', 'true');
  });

  it('monitoring alerts should be 5', () => {
    render(<MonitoringOverview {...monitoringOverviewProps} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  it('alerts section should not be present if there are no firing alerts', () => {
    const propsWithPendingAlerts = {
      ...monitoringOverviewProps,
      monitoringAlerts: monitoringOverviewProps.monitoringAlerts.map((alert) => ({
        ...alert,
        state: AlertStates.Pending,
      })),
    };

    render(<MonitoringOverview {...propsWithPendingAlerts} />);

    expect(screen.queryByTestId('monitoring-overview-alerts')).not.toBeInTheDocument();
    expect(screen.queryByText('Alerts')).not.toBeInTheDocument();
  });

  it('all events accordion should not be expanded by default', () => {
    render(<MonitoringOverview {...monitoringOverviewProps} />);

    const allEventsAccordion = document.getElementById('all-events-accordian-item');
    expect(allEventsAccordion).toHaveAttribute('data-is-expanded', 'false');
  });

  it('should expand & collapse Metric Section accordion', () => {
    render(<MonitoringOverview {...monitoringOverviewProps} />);

    const metricsToggle = document.getElementById('metrics');
    const metricsAccordion = document.getElementById('metrics-accordian-item');
    expect(metricsAccordion).toHaveAttribute('data-is-expanded', 'true');
    fireEvent.click(metricsToggle);
    expect(metricsAccordion).toHaveAttribute('data-is-expanded', 'false');
    fireEvent.click(metricsToggle);
    expect(metricsAccordion).toHaveAttribute('data-is-expanded', 'true');
  });

  it('should render workload graphs for non-DeploymentConfig resources', () => {
    render(<MonitoringOverview {...monitoringOverviewProps} />);

    expect(screen.getByTestId('workload-graphs')).toBeInTheDocument();
    expect(screen.getByText('View dashboards')).toBeInTheDocument();
  });

  it('should render empty state for DeploymentConfig resources', () => {
    const dcProps = {
      ...monitoringOverviewProps,
      resource: {
        ...monitoringOverviewProps.resource,
        kind: 'DeploymentConfig',
      },
    };

    render(<MonitoringOverview {...dcProps} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('Deployment Configuration metrics are not yet supported.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('workload-graphs')).not.toBeInTheDocument();
    expect(screen.queryByText('View dashboards')).not.toBeInTheDocument();
  });

  it('should render loading box when resource events are not loaded', () => {
    const loadingProps = {
      ...monitoringOverviewProps,
      resourceEvents: { ...mockResourceEvents, loaded: false },
    };

    render(<MonitoringOverview {...loadingProps} />);

    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
  });
});
