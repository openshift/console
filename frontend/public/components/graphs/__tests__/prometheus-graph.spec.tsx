import { screen, cleanup } from '@testing-library/react';
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
  it('should render a title', () => {
    renderWithProviders(<PrometheusGraph title="Test" />);

    const titleElement = screen.getByRole('heading', { level: 5 });
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('Test');
  });

  it('should not render a title', () => {
    renderWithProviders(<PrometheusGraph />);

    const titleElement = screen.queryByRole('heading', { level: 5 });
    expect(titleElement).not.toBeInTheDocument();
  });

  it('should render children content', () => {
    renderWithProviders(
      <PrometheusGraph title="Test Graph">
        <div data-testid="child-content">Chart content here</div>
      </PrometheusGraph>,
    );

    // Verify both title and children are rendered
    expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Test Graph');
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Chart content here')).toBeInTheDocument();
  });
});

describe('<PrometheusGraphLink />', () => {
  const renderPrometheusGraphLink = (query: string) => {
    return renderWithProviders(
      <PrometheusGraphLink query={query}>
        <p data-testid="test-child">Test content</p>
      </PrometheusGraphLink>,
      { store },
    );
  };

  beforeEach(() => {
    window.SERVER_FLAGS.prometheusBaseURL = 'prometheusBaseURL';
  });

  afterEach(() => {
    cleanup();
    useActivePerspectiveMock.mockClear();
  });

  it('should not render a link when query is empty', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    store.dispatch(UIActions.setActiveNamespace('default'));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    renderPrometheusGraphLink('');
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should render a link when query is provided', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, false));
    store.dispatch(UIActions.setActiveNamespace('default'));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    renderPrometheusGraphLink('test');
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dev-monitoring/ns/default/metrics?query0=test');
  });

  it('should use admin perspective routes when in admin mode', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, true));
    store.dispatch(UIActions.setActiveNamespace('default'));
    useActivePerspectiveMock.mockReturnValue(['admin', () => {}]);

    // No query - should not have link
    renderPrometheusGraphLink('');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    // With query - should have admin route
    renderPrometheusGraphLink('test');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/monitoring/query-browser?query0=test');
  });

  it('should use dev perspective routes when CAN_GET_NS is true in dev mode', () => {
    store.dispatch(setFlag(FLAGS.CAN_GET_NS, true));
    store.dispatch(UIActions.setActiveNamespace('default'));
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);

    renderPrometheusGraphLink('test');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dev-monitoring/ns/default/metrics?query0=test');
  });
});
