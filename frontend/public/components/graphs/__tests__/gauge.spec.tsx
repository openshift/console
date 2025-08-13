import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { GaugeChart } from '@console/internal/components/graphs/gauge';

const MOCK_DATA = { x: 'test', y: 100 };

describe('<GaugeChart />', () => {
  it('should render a gauge chart', () => {
    renderWithProviders(<GaugeChart title="Test Gauge" label="Test" data={MOCK_DATA} />);

    expect(screen.getByRole('heading', { name: 'Test Gauge' })).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test Gauge' })).toBeInTheDocument();
  });

  it('should show an error state', () => {
    renderWithProviders(
      <GaugeChart title="Test Gauge" label="Test" data={MOCK_DATA} error="Error Message" />,
    );

    expect(screen.getByText('Error Message')).toBeInTheDocument();
  });

  it('should show a loading state', () => {
    renderWithProviders(<GaugeChart title="Test Gauge" label="Test" data={MOCK_DATA} loading />);

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});
