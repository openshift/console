import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';

describe('GraphEmpty', () => {
  it('should render a loading state', () => {
    renderWithProviders(<GraphEmpty loading={true} />);

    expect(screen.getByTestId('skeleton-chart')).toBeInTheDocument();
  });

  it('should render an empty state', () => {
    renderWithProviders(<GraphEmpty />);

    expect(screen.getByText('No datapoints found.')).toBeVisible();
  });
});
