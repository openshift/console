import * as React from 'react';
import { shallow } from 'enzyme';
import { EventsList } from '@console/internal/components/events';
import MonitoringEvents from '../MonitoringEvents';

type MonitoringEventsProps = React.ComponentProps<typeof MonitoringEvents>;

describe('Monitoring Dashboard Tab', () => {
  const MonitoringEventsProps: MonitoringEventsProps = {
    match: {
      params: {
        ns: 'monitoring-event-test',
      },
      isExact: true,
      path: '',
      url: '',
    },
  };

  it('should render Events tab under Monitoring page', () => {
    const wrapper = shallow(<MonitoringEvents {...MonitoringEventsProps} />);
    expect(wrapper.find(EventsList).exists()).toBe(true);
  });
});
