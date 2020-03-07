import * as React from 'react';
import { shallow } from 'enzyme';
import MonitoringOverview from '../MonitoringOverview';
import { Badge } from '@patternfly/react-core';

describe('Monitoring Metric Section', () => {
  const metSecProps: React.ComponentProps<typeof MonitoringOverview> = {
    resource: {
      metadata: {
        name: 'workload-name',
        namespace: 'test',
      },
      spec: {},
      status: {},
      kind: 'Deployment',
    },
    events: {
      loaded: true,
      loadError: '',
      data: [],
    },
  };

  it('metrics accordion should be expanded by default', () => {
    const component = shallow(<MonitoringOverview {...metSecProps} />);
    expect(component.find('#metrics').prop('isExpanded')).toBe(true);
    expect(component.find('#metrics-content').prop('isHidden')).toBe(false);
  });

  it('events warning accordion should not be expanded by default', () => {
    const component = shallow(<MonitoringOverview {...metSecProps} />);
    expect(component.find('#events-warning').prop('isExpanded')).toBe(false);
    expect(component.find('#events-warning-content').prop('isHidden')).toBe(true);
  });

  it('all events accordion should not be expanded by default', () => {
    const component = shallow(<MonitoringOverview {...metSecProps} />);
    expect(component.find('#all-events').prop('isExpanded')).toBe(false);
    expect(component.find('#all-events-content').prop('isHidden')).toBe(true);
  });

  it('should expand & collapse Metric Section accordion', () => {
    const component = shallow(<MonitoringOverview {...metSecProps} />);
    component.find('#metrics').simulate('click');
    expect(component.find('#metrics').prop('isExpanded')).toBe(false);
    expect(component.find('#metrics-content').prop('isHidden')).toBe(true);
    component.find('#metrics').simulate('click');
    expect(component.find('#metrics').prop('isExpanded')).toBe(true);
    expect(component.find('#metrics-content').prop('isHidden')).toBe(false);
  });

  it('event warning should be 0', () => {
    const component = shallow(<MonitoringOverview {...metSecProps} />);
    expect(component.find(Badge).props().children).toBe(0);
  });
});
