import * as React from 'react';
import { shallow } from 'enzyme';
import MetricsQueryInput from '../MetricsQueryInput';
import { MonitoringMetrics } from '../MonitoringMetrics';

describe('Monitoring Metrics Tab', () => {
  it('should render Monitoring Metrics tab', () => {
    const wrapper = shallow(<MonitoringMetrics />);
    expect(wrapper.contains(<MetricsQueryInput />)).toBe(true);
  });
});
