import { screen, configure } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { BarChart } from '@console/internal/components/graphs/bar';

const MOCK_DATA = [
  { x: 'Test A', y: 100 },
  { x: 'Test B', y: 200 },
  { x: 'Test C', y: 75 },
];

describe('<BarChart />', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render correct number of bars with dimensions and title', () => {
    renderWithProviders(<BarChart title="Test Bar Chart" data={MOCK_DATA} loading={false} />);

    expect(screen.getByRole('heading', { name: 'Test Bar Chart' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Test Bar Chart' })).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeVisible();

    // Check that each individual bar is rendered
    expect(screen.getByTestId('bar-chart-0')).toBeVisible();
    expect(screen.getByTestId('bar-chart-1')).toBeVisible();
    expect(screen.getByTestId('bar-chart-2')).toBeVisible();

    // Check that bar labels are rendered
    expect(screen.getByText('Test A')).toBeVisible();
    expect(screen.getByText('Test B')).toBeVisible();
    expect(screen.getByText('Test C')).toBeVisible();
  });

  it('should handle loading state', () => {
    renderWithProviders(<BarChart title="Loading Chart" data={[]} loading={true} />);

    // Should show skeleton/loading state
    expect(screen.getByTestId('skeleton-chart')).toBeInTheDocument();

    // Title should still be rendered
    expect(screen.getByRole('heading', { name: 'Loading Chart' })).toBeVisible();
  });

  it('should show an empty state', () => {
    renderWithProviders(<BarChart data={[]} loading={false} />);

    expect(screen.getByText('No datapoints found.')).toBeVisible();
  });
});
