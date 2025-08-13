import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { BarChart } from '@console/internal/components/graphs/bar';

const MOCK_DATA = [{ x: 1, y: 100 }];

describe('<BarChart />', () => {
  it('should render a bar chart', () => {
    renderWithProviders(<BarChart title="Test Bar" data={MOCK_DATA} />);

    expect(screen.getByRole('heading', { name: 'Test Bar' })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show an empty state', () => {
    renderWithProviders(<BarChart data={[]} />);

    expect(screen.getByText('No datapoints found.')).toBeInTheDocument();
  });

  it('should render a loading state', () => {
    const { container } = renderWithProviders(<BarChart data={[]} loading />);

    const skeletonElement = container.querySelector('[data-test="skeleton-chart"]');
    expect(skeletonElement).toBeInTheDocument();
  });
});
