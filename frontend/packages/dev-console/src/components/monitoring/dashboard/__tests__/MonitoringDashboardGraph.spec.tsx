import * as React from 'react';
import { shallow } from 'enzyme';
import { Area } from '@console/internal/components/graphs/area';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { queries } from '../monitoringDashboardQueries';
import MonitoringDashboardGraph, { GraphTypes } from '../MonitoringDashboardGraph';

describe('Monitoring Dashboard graph', () => {
  let monitoringDashboardGraphProps: React.ComponentProps<typeof MonitoringDashboardGraph>;

  beforeAll(() => {
    const query = queries[1];
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
});
