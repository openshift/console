import { act, screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { FLAGS } from '@console/shared/src/constants/common';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { setFlag } from '@console/internal/actions/flags';
import * as UIActions from '@console/internal/actions/ui';
import {
  PrometheusGraph,
  PrometheusGraphLink,
} from '@console/internal/components/graphs/prometheus-graph';

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
    useActivePerspectiveMock.mockClear();
  });

  it('should not render a link when query is empty', () => {
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    const { store } = renderWithProviders(
      <PrometheusGraphLink query="">
        <p>Test content</p>
      </PrometheusGraphLink>,
    );
    act(() => {
      store.dispatch(UIActions.setActiveNamespace('default'));
    });

    expect(screen.getByText('Test content')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe('PrometheusGraphLink', () => {
    const testScenarios = [
      {
        perspective: 'admin',
        expectedUrl: '/monitoring/query-browser?query0=test&namespace=default',
        description: 'admin perspective graph link',
      },
      {
        perspective: 'dev',
        expectedUrl: '/monitoring/query-browser?query0=test&namespace=default',
        description: 'dev perspective graph link',
      },
    ];

    testScenarios.forEach(({ perspective, expectedUrl, description }) => {
      it(`should generate correct URL for ${description}`, () => {
        useActivePerspectiveMock.mockReturnValue([perspective, () => {}]);

        const { store } = renderWithProviders(
          <PrometheusGraphLink query={MOCK_PROMETHEUS_QUERY}>
            <p>{MOCK_CONTENT_TEXT}</p>
          </PrometheusGraphLink>,
        );
        act(() => {
          store.dispatch(UIActions.setActiveNamespace('default'));
        });

        expect(screen.getByText(MOCK_CONTENT_TEXT)).toBeVisible();
        const link = screen.getByRole('link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', expectedUrl);
      });
    });

    it('should not render link when query is empty regardless of permissions', () => {
      useActivePerspectiveMock.mockReturnValue(['admin', () => {}]);

      const { store } = renderWithProviders(
        <PrometheusGraphLink query="">
          <p>Test content</p>
        </PrometheusGraphLink>,
      );
      act(() => {
        store.dispatch(UIActions.setActiveNamespace('default'));
        store.dispatch(setFlag(FLAGS.CAN_GET_NS, true));
      });

      expect(screen.getByText('Test content')).toBeVisible();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('should use ariaChartLinkLabel for accessibility', () => {
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    const { store } = renderWithProviders(
      <PrometheusGraphLink query={MOCK_PROMETHEUS_QUERY} ariaChartLinkLabel={MOCK_ARIA_LABEL}>
        <p>{MOCK_CONTENT_TEXT}</p>
      </PrometheusGraphLink>,
    );
    act(() => {
      store.dispatch(UIActions.setActiveNamespace('default'));
      store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    });

    expect(screen.getByText(MOCK_CONTENT_TEXT)).toBeVisible();
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName(MOCK_ARIA_LABEL);
  });

  it('should render children content correctly', () => {
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    const { store } = renderWithProviders(
      <PrometheusGraphLink query="test">
        <div>
          <span>Chart data</span>
          <button>Action</button>
        </div>
      </PrometheusGraphLink>,
    );
    act(() => {
      store.dispatch(UIActions.setActiveNamespace('default'));
      store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    });

    expect(screen.getByText('Chart data')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
