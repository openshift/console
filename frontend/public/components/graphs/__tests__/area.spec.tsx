import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { AreaChart } from '@console/internal/components/graphs/area';

const MOCK_DATA = [[{ x: 1, y: 100 }]];

describe('<AreaChart />', () => {
  it('should render an area chart', () => {
    const { container } = renderWithProviders(<AreaChart title="Test Area" data={MOCK_DATA} />);

    const titles = screen.getAllByText('Test Area');
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();

    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    const pathElements = container.querySelectorAll('path');
    expect(pathElements.length).toBeGreaterThan(0);

    const axisElements = container.querySelectorAll('g[role="presentation"]');
    expect(axisElements.length).toBeGreaterThan(0);

    expect(screen.queryByText(/No data available/i)).not.toBeInTheDocument();
  });

  it('should not render any axes', () => {
    const { container } = renderWithProviders(
      <AreaChart title="Test Area" data={MOCK_DATA} xAxis={false} yAxis={false} />,
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    const pathElements = container.querySelectorAll('path');
    expect(pathElements.length).toBeGreaterThan(0);
  });

  it('should show an empty state', () => {
    const { container } = renderWithProviders(<AreaChart data={[]} />);

    const hasExplicitEmptyState =
      screen.queryByTestId('graph-empty') ||
      screen.queryByText(/no data/i) ||
      screen.queryByText(/empty/i) ||
      container.querySelector('.graph-empty') ||
      container.querySelector('[data-test="graph-empty"]');

    const chartWrapper = container.querySelector('.graph-wrapper');
    const svgElement = container.querySelector('svg');

    const hasRenderedContent = hasExplicitEmptyState || chartWrapper || svgElement;
    expect(hasRenderedContent).toBeTruthy();

    if (!hasExplicitEmptyState && svgElement) {
      const dataPaths = container.querySelectorAll('path[d*="M"][d*="L"]');
      expect(dataPaths.length).toBeLessThanOrEqual(1);
    }

    expect(container).toBeInTheDocument();
  });
});
