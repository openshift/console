import { screen, configure } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { FLAGS } from '@console/shared';
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

describe('<PrometheusGraph />', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render a title', () => {
    renderWithProviders(<PrometheusGraph title="Test Graph" />);

    expect(screen.getByRole('heading', { name: 'Test Graph' })).toBeVisible();
  });

  it('should not render a title', () => {
    renderWithProviders(<PrometheusGraph />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render children content', () => {
    renderWithProviders(
      <PrometheusGraph title="Test Graph">
        <div>Chart content</div>
      </PrometheusGraph>,
    );

    expect(screen.getByRole('heading', { name: 'Test Graph' })).toBeVisible();
    expect(screen.getByText('Chart content')).toBeVisible();
  });
});

describe('<PrometheusGraphLink />', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

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

  describe('<PrometheusGraphLink />', () => {
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
          <PrometheusGraphLink query="test">
            <p>Test content</p>
          </PrometheusGraphLink>,
          { store },
        );

        expect(screen.getByText('Test content')).toBeVisible();
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
      <PrometheusGraphLink query="test" ariaChartLinkLabel="View metrics in Prometheus">
        <p>Test content</p>
      </PrometheusGraphLink>,
      { store },
    );

    expect(screen.getByText('Test content')).toBeVisible();
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName('View metrics in Prometheus');
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
