import { screen } from '@testing-library/react';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

describe('GraphEmpty', () => {
  it('should render a loading state', () => {
    renderWithProviders(<GraphEmpty loading />);

    expect(screen.getByTestId('skeleton-chart')).toBeInTheDocument();
  });

  it('should render an empty state', () => {
    renderWithProviders(<GraphEmpty />);

    expect(screen.getByText('No datapoints found.')).toBeVisible();
  });
});
