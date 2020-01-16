import * as React from 'react';
import { shallow } from 'enzyme';
import MonitoringDashboard from '../MonitoringDashboard';

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
});
