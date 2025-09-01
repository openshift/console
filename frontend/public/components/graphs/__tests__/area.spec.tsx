import { screen, configure } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { AreaChart } from '@console/internal/components/graphs/area';

const MOCK_AREA_DATA = [
  [
    { x: new Date('2023-01-01T10:00:00Z'), y: 100 },
    { x: new Date('2023-01-01T11:00:00Z'), y: 250 },
    { x: new Date('2023-01-01T12:00:00Z'), y: 75 },
  ],
];

const MOCK_EMPTY_DATA = [];
const MOCK_LOADING_DATA = [[]];

describe('AreaChart', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render an area chart', () => {
    renderWithProviders(
      <AreaChart data={MOCK_AREA_DATA} loading={false} height={120} title="Test Area Chart" />,
    );

    expect(screen.getByRole('heading', { name: 'Test Area Chart' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Test Area Chart' })).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('should not render any axis', () => {
    renderWithProviders(
      <AreaChart data={MOCK_AREA_DATA} xAxis={false} yAxis={false} loading={false} />,
    );

    // Check that the chart is rendered but axes are not
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('area-chart-x-axis')).not.toBeInTheDocument();
    expect(screen.queryByTestId('area-chart-y-axis')).not.toBeInTheDocument();
  });

  it('should show an empty state', () => {
    renderWithProviders(<AreaChart data={MOCK_EMPTY_DATA} loading={false} />);

    expect(screen.getByText('No datapoints found.')).toBeVisible();
  });

  it('should show a loading state', () => {
    renderWithProviders(
      <AreaChart data={MOCK_LOADING_DATA} loading={true} title="Loading Chart" />,
    );

    expect(screen.getByTestId('skeleton-chart')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Loading Chart' })).toBeVisible();
  });
});
