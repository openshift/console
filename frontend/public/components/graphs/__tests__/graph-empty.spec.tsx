import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';

describe('<GraphEmpty />', () => {
  it('should render a loading state', () => {
    const { container } = renderWithProviders(<GraphEmpty loading />);

    const skeletonElement = container.querySelector('[data-test="skeleton-chart"]');
    expect(skeletonElement).toBeInTheDocument();
  });

  it('should render an empty state', () => {
    const { container } = renderWithProviders(<GraphEmpty />);

    expect(screen.getByText('No datapoints found.')).toBeInTheDocument();

    const messageElement = container.querySelector('[data-test="datapoints-msg"]');
    expect(messageElement).toBeInTheDocument();

    expect(messageElement).toHaveTextContent('No datapoints found.');
  });
});
