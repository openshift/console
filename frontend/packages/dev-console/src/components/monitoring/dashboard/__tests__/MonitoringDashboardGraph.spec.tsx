import * as React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { t } from '../../../../../../../__mocks__/i18next';
import { monitoringDashboardQueries } from '../../queries';
import { MonitoringDashboardGraph, GraphTypes } from '../MonitoringDashboardGraph';

jest.mock('@console/shared/src/components/query-browser', () => ({
  QueryBrowser: ({ isStack }: { isStack: boolean }) => `QueryBrowser isStack=${isStack}`,
}));

describe('Monitoring Dashboard graph', () => {
  let monitoringDashboardGraphProps: React.ComponentProps<typeof MonitoringDashboardGraph>;

  beforeAll(() => {
    const query = monitoringDashboardQueries(t)[1];
    monitoringDashboardGraphProps = {
      title: query.title,
      namespace: 'test-project',
      graphType: query.chartType,
      query: query.query({ namespace: 'test-project' }),
      humanize: query.humanize,
      byteDataType: query.byteDataType,
      timespan: 1800000,
      pollInterval: 30000,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render area graph with stacked query browser', () => {
    renderWithProviders(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);

    expect(screen.getByText('QueryBrowser isStack=true')).toBeVisible();
  });

  it('should render line graph with unstacked query browser', () => {
    monitoringDashboardGraphProps.graphType = GraphTypes.line;
    renderWithProviders(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);

    expect(screen.getByText('QueryBrowser isStack=false')).toBeVisible();
  });

  it('should add link to line graph', () => {
    monitoringDashboardGraphProps.graphType = GraphTypes.line;
    renderWithProviders(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);

    const link = screen.getByRole('link', { name: 'View metrics for Memory usage' });

    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain(
      'sum%28container_memory_working_set_bytes%7Bcontainer%21%3D%22%22%2C+namespace%3D%27test-project%27%7D%29+by+%28pod%29',
    );
  });
});
