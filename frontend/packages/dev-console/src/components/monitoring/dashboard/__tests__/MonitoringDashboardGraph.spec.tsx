import * as React from 'react';
import { screen, render } from '@testing-library/react';
import { shallow } from 'enzyme';
import '@testing-library/jest-dom';
import * as redux from 'react-redux';
import { BrowserRouter } from 'react-router-dom-v5-compat';
import { QueryBrowser } from '@console/shared/src/components/query-browser';
import { t } from '../../../../../../../__mocks__/i18next';
import { monitoringDashboardQueries } from '../../queries';
import { MonitoringDashboardGraph, GraphTypes } from '../MonitoringDashboardGraph';

describe('Monitoring Dashboard graph', () => {
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const spyDispatch = jest.spyOn(redux, 'useDispatch');
  spyDispatch.mockReturnValue(() => {});
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

  it('should render area graph', () => {
    const wrapper = shallow(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);
    expect(wrapper.find(QueryBrowser).props().isStack).toBe(true);
  });

  it('should render line graph', () => {
    monitoringDashboardGraphProps.graphType = GraphTypes.line;
    const wrapper = shallow(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);
    expect(wrapper.find(QueryBrowser).props().isStack).toBe(false);
  });

  it('should add link to line graph', () => {
    monitoringDashboardGraphProps.graphType = GraphTypes.line;
    render(
      <BrowserRouter>
        <MonitoringDashboardGraph {...monitoringDashboardGraphProps} />
      </BrowserRouter>,
    );

    const link = screen.getByRole('link', { name: 'View metrics for Memory usage' });

    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain(
      'sum%28container_memory_working_set_bytes%7Bcontainer%21%3D%22%22%2C+namespace%3D%27test-project%27%7D%29+by+%28pod%29',
    );
  });
});
