import * as React from 'react';
import { shallow } from 'enzyme';
import * as redux from 'react-redux';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { t } from '../../../../../../../__mocks__/i18next';
import { monitoringDashboardQueries } from '../../queries';
import { MonitoringDashboardGraph, GraphTypes } from '../MonitoringDashboardGraph';

describe('Monitoring Dashboard graph', () => {
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
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
    const wrapper = shallow(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);
    expect(wrapper.find('PrometheusGraphLink').exists()).toBe(true);
    expect(wrapper.find('PrometheusGraphLink').prop('query')).toEqual(
      monitoringDashboardGraphProps.query,
    );
  });
});
