import * as React from 'react';
import { shallow } from 'enzyme';
import * as link from '@console/internal/components/utils';
import {
  TimespanDropdown,
  PollIntervalDropdown,
} from '@console/internal/components/monitoring/dashboards';
import { ResourceDropdown } from '@console/shared';
import { Firehose } from '@console/internal/components/utils/firehose';
import { MonitoringDashboard } from '../MonitoringDashboard';
import { OptionTypes, MonitoringWorkloadFilter } from '../MonitoringWorkloadFilter';
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
    timespan: 1800000,
    pollInterval: 90000,
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
    spygetURLSearchParams.mockReturnValue({ workloadName: 'dotnet', workloadType: 'Deployment' });
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

  it('should render Time Range & Refresh Interval dropdowns', () => {
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    expect(wrapper.find(TimespanDropdown).exists()).toBe(true);
    expect(wrapper.find(PollIntervalDropdown).exists()).toBe(true);
  });

  it('should render workload filter dropdown with preselected workload in dashboard', () => {
    const spygetURLSearchParams = jest.spyOn(link, 'getURLSearchParams');
    spygetURLSearchParams.mockReturnValue({
      workloadName: 'calculator-react',
      workloadType: 'Deployment',
    });
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    const filterDropdown = wrapper.find(MonitoringWorkloadFilter);
    expect(filterDropdown.exists()).toBe(true);
    expect(filterDropdown.props().name).toBe('calculator-react');
  });

  it('should render filter dropdown with no selection for namespace queries dashboard', () => {
    const spygetURLSearchParams = jest.spyOn(link, 'getURLSearchParams');
    spygetURLSearchParams.mockReturnValue({});
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    const filterDropdown = wrapper.find(MonitoringWorkloadFilter);
    expect(filterDropdown.exists()).toBe(true);
    expect(filterDropdown.props().name).toBe(OptionTypes.selectAll);
  });

  it('should render filter dropdown with correct resources and select all option', () => {
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    const filterDropdown = wrapper.find(MonitoringWorkloadFilter);
    const FirehoseResources = filterDropdown.dive().find(Firehose);
    expect(FirehoseResources.props().resources).toHaveLength(3);
  });

  it('should render filter dropdown with badge', () => {
    const wrapper = shallow(<MonitoringDashboard {...monitoringDashboardProps} />);
    const filterDropdown = wrapper.find(MonitoringWorkloadFilter);
    expect(
      filterDropdown
        .dive()
        .find(ResourceDropdown)
        .props().showBadge,
    ).toBeTruthy();
  });
});
