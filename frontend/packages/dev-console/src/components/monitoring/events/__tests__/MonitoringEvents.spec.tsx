import * as React from 'react';
import { shallow } from 'enzyme';
import { EventsList } from '@console/internal/components/events';
import MonitoringEvents from '../MonitoringEvents';

describe('Monitoring Dashboard Tab', () => {
  it('should render Events tab under Monitoring page', () => {
    const wrapper = shallow(<MonitoringEvents />);
    expect(wrapper.find(EventsList).exists()).toBe(true);
  });
});
