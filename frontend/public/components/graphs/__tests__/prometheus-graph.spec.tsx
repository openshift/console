import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { FLAGS } from '@console/shared/src/constants/common';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { setFlag } from '@console/internal/actions/flags';
import * as UIActions from '@console/internal/actions/ui';
import {
  PrometheusGraph,
  PrometheusGraphLink,
} from '@console/internal/components/graphs/prometheus-graph';
import store from '@console/internal/redux';

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(),
}));

const useActivePerspectiveMock = useActivePerspective as jest.Mock;

const MOCK_GRAPH_TITLE = 'Test Graph';
const MOCK_PROMETHEUS_QUERY = 'test';
const MOCK_ARIA_LABEL = 'View metrics in Prometheus';
const MOCK_CONTENT_TEXT = 'Test content';
const MOCK_CHART_CONTENT = 'Chart content';

describe('PrometheusGraph', () => {
  it('should render a title', () => {
    renderWithProviders(<PrometheusGraph title={MOCK_GRAPH_TITLE} />);

    expect(screen.getByRole('heading', { name: MOCK_GRAPH_TITLE })).toBeVisible();
  });

  it('should not render a title', () => {
    renderWithProviders(<PrometheusGraph />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render children content', () => {
    renderWithProviders(
      <PrometheusGraph title={MOCK_GRAPH_TITLE}>
        <div>{MOCK_CHART_CONTENT}</div>
      </PrometheusGraph>,
    );

    expect(screen.getByRole('heading', { name: MOCK_GRAPH_TITLE })).toBeVisible();
    expect(screen.getByText(MOCK_CHART_CONTENT)).toBeVisible();
  });
});

describe('PrometheusGraphLink', () => {
  beforeEach(() => {
    window.SERVER_FLAGS.prometheusBaseURL = 'prometheusBaseURL';
    store.dispatch(UIActions.setActiveNamespace('default'));
    useActivePerspectiveMock.mockClear();
  });

  it('should not render a link when query is empty', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    renderWithProviders(
      <PrometheusGraphLink query="">
        <p>Test content</p>
      </PrometheusGraphLink>,
      { store },
    );

    expect(screen.getByText('Test content')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe('PrometheusGraphLink', () => {
    const testScenarios = [
      {
        perspective: 'admin',
        canGetNS: false,
        expectedUrl: '/dev-monitoring/ns/default/metrics?query0=test',
        description: 'admin perspective with CAN_GET_NS=false',
      },
      {
        perspective: 'admin',
        canGetNS: true,
        expectedUrl: '/monitoring/query-browser?query0=test',
        description: 'admin perspective with CAN_GET_NS=true',
      },
      {
        perspective: 'dev',
        canGetNS: false,
        expectedUrl: '/dev-monitoring/ns/default/metrics?query0=test',
        description: 'dev perspective with CAN_GET_NS=false',
      },
      {
        perspective: 'dev',
        canGetNS: true,
        expectedUrl: '/dev-monitoring/ns/default/metrics?query0=test',
        description: 'dev perspective with CAN_GET_NS=true',
      },
    ];

    testScenarios.forEach(({ perspective, canGetNS, expectedUrl, description }) => {
      it(`should generate correct URL for ${description}`, () => {
        store.dispatch(setFlag(FLAGS.CAN_GET_NS, canGetNS));
        useActivePerspectiveMock.mockReturnValue([perspective, () => {}]);

        renderWithProviders(
          <PrometheusGraphLink query={MOCK_PROMETHEUS_QUERY}>
            <p>{MOCK_CONTENT_TEXT}</p>
          </PrometheusGraphLink>,
          { store },
        );

        expect(screen.getByText(MOCK_CONTENT_TEXT)).toBeVisible();
        const link = screen.getByRole('link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', expectedUrl);
      });
    });

    it('should not render link when query is empty regardless of permissions', () => {
      store.dispatch(setFlag(FLAGS.CAN_GET_NS, true));
      useActivePerspectiveMock.mockReturnValue(['admin', () => {}]);

      renderWithProviders(
        <PrometheusGraphLink query="">
          <p>Test content</p>
        </PrometheusGraphLink>,
        { store },
      );

      expect(screen.getByText('Test content')).toBeVisible();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('should use ariaChartLinkLabel for accessibility', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    renderWithProviders(
      <PrometheusGraphLink query={MOCK_PROMETHEUS_QUERY} ariaChartLinkLabel={MOCK_ARIA_LABEL}>
        <p>{MOCK_CONTENT_TEXT}</p>
      </PrometheusGraphLink>,
      { store },
    );

    expect(screen.getByText(MOCK_CONTENT_TEXT)).toBeVisible();
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName(MOCK_ARIA_LABEL);
  });

  it('should render children content correctly', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    renderWithProviders(
      <PrometheusGraphLink query="test">
        <div>
          <span>Chart data</span>
          <button>Action</button>
        </div>
      </PrometheusGraphLink>,
      { store },
    );

    expect(screen.getByText('Chart data')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
