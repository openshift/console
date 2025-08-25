import { screen, configure } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

import { GaugeChart } from '@console/internal/components/graphs/gauge';

const MOCK_DATA = { x: 'CPU', y: 75 };

describe('<GaugeChart />', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render a gauge chart', () => {
    renderWithProviders(
      <GaugeChart title="Test Gauge" label="75%" data={MOCK_DATA} loading={false} />,
    );

    expect(screen.getByRole('heading', { name: 'Test Gauge' })).toBeVisible();
    expect(screen.getByText('75%')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Test Gauge' })).toBeInTheDocument();
    expect(screen.getByTestId('gauge-chart')).toBeInTheDocument();
  });

  it('should show an error state', () => {
    renderWithProviders(
      <GaugeChart title="Test Gauge" label="Test" data={MOCK_DATA} error="Error Message" />,
    );

    expect(screen.getByText('Error Message')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Test Gauge' })).toBeVisible();
  });

  it('should show a loading state', () => {
    renderWithProviders(
      <GaugeChart title="Test Gauge" label="Test" data={MOCK_DATA} loading={true} />,
    );

    expect(screen.getByText('Loading')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Test Gauge' })).toBeVisible();
  });
});
