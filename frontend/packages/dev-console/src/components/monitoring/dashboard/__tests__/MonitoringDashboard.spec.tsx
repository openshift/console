import * as React from 'react';
import { shallow } from 'enzyme';
import * as link from '@console/internal/components/utils';
import MonitoringDashboard from '../MonitoringDashboard';
import ConnectedMonitoringDashboardGraph from '../MonitoringDashboardGraph';
import { monitoringDashboardQueries, topWorkloadMetricsQueries } from '../../queries';

type MonitoringDashboardProps = React.ComponentProps<typeof MonitoringDashboard>;

describe('Monitoring Dashboard Tab', () => {
  const monitoringDashboardProps: MonitoringDashboardProps = {
    match: {
      params: {
        ns: 'monitoring-test',
      },
      isExact: true,
      path: '',
      url: '',
    },
  };

  it('should render Monitoring Dashboard tab', () => {
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    expect(wrapper.contains(<title>Dashboard</title>)).toBe(true);
  });

  it('should render all workload queries', () => {
    const workloadQuery = topWorkloadMetricsQueries[0].query({
      namespace: monitoringDashboardProps.match.params.ns,
      workloadName: 'dotnet',
      workloadType: 'deployment',
    });
    const spygetURLSearchParams = jest.spyOn(link, 'getURLSearchParams');
    spygetURLSearchParams.mockReturnValue({ workloadName: 'dotnet', workloadType: 'deployment' });
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    expect(
      wrapper
        .find(ConnectedMonitoringDashboardGraph)
        .first()
        .props().query,
    ).toEqual(workloadQuery);
  });

  it('should render dashboard queries', () => {
    const dashboardQuery = monitoringDashboardQueries[0].query({
      namespace: monitoringDashboardProps.match.params.ns,
    });
    const spygetURLSearchParams = jest.spyOn(link, 'getURLSearchParams');
    spygetURLSearchParams.mockReturnValue({});
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    expect(
      wrapper
        .find(ConnectedMonitoringDashboardGraph)
        .first()
        .props().query,
    ).toEqual(dashboardQuery);
  });
});
