import * as React from 'react';
import { shallow } from 'enzyme';
import { Area } from '@console/internal/components/graphs/area';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { PrometheusGraphLink } from '@console/internal/components/graphs/prometheus-graph';
import { monitoringDashboardQueries } from '../../queries';
import MonitoringDashboardGraph, { GraphTypes } from '../MonitoringDashboardGraph';

describe('Monitoring Dashboard graph', () => {
  let monitoringDashboardGraphProps: React.ComponentProps<typeof MonitoringDashboardGraph>;

  beforeAll(() => {
    const query = monitoringDashboardQueries[1];
    monitoringDashboardGraphProps = {
      title: query.title,
      namespace: 'test-project',
      graphType: query.chartType,
      query: query.query({ namespace: 'test-project' }),
      humanize: query.humanize,
      byteDataType: query.byteDataType,
    };
  });

  it('should render area graph', () => {
    const wrapper = shallow(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);
    expect(wrapper.find(Area).exists()).toBe(true);
  });

  it('should render line graph', () => {
    monitoringDashboardGraphProps.graphType = GraphTypes.line;
    const wrapper = shallow(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);
    expect(wrapper.find(QueryBrowser).exists()).toBe(true);
  });

  it('should add link to line graph', () => {
    monitoringDashboardGraphProps.graphType = GraphTypes.line;
    const wrapper = shallow(<MonitoringDashboardGraph {...monitoringDashboardGraphProps} />);
    expect(wrapper.find(PrometheusGraphLink).exists()).toBe(true);
    expect(wrapper.find(PrometheusGraphLink).props().query).toEqual(
      monitoringDashboardGraphProps.query,
    );
  });
});
