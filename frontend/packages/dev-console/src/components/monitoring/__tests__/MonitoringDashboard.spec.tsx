import * as React from 'react';
import { shallow } from 'enzyme';
import MonitoringDashboard from '../MonitoringDashboard';

describe('Monitoring Dashboard Tab', () => {
  it('should render monitoring dashboard tab', () => {
    const wrapper = shallow(<MonitoringDashboard />);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.contains(<title>Dashboard</title>)).toBe(true);
  });
});
