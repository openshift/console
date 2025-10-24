import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { GaugeChart } from '@console/internal/components/graphs/gauge';

const MOCK_GAUGE_DATA = { x: 'CPU Usage', y: 75 };
const MOCK_ERROR_DATA = { x: 'Memory Usage', y: 85 };
const MOCK_LOADING_DATA = { x: 'Disk Usage', y: 50 };

describe('GaugeChart', () => {
  it('should render a gauge chart', () => {
    renderWithProviders(
      <GaugeChart title="Test Gauge" label="75%" data={MOCK_GAUGE_DATA} loading={false} />,
    );

    expect(screen.getByRole('heading', { name: 'Test Gauge' })).toBeVisible();
    expect(screen.getByText('75%')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Test Gauge' })).toBeInTheDocument();
    expect(screen.getByTestId('gauge-chart')).toBeInTheDocument();
  });

  it('should show an error state', () => {
    renderWithProviders(
      <GaugeChart title="Error Gauge" label="Error" data={MOCK_ERROR_DATA} error="Error Message" />,
    );

    expect(screen.getByText('Error Message')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Error Gauge' })).toBeVisible();
  });

  it('should show a loading state', () => {
    renderWithProviders(
      <GaugeChart title="Loading Gauge" label="Loading" data={MOCK_LOADING_DATA} loading={true} />,
    );

    expect(screen.getByText('Loading')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Loading Gauge' })).toBeVisible();
  });
});
