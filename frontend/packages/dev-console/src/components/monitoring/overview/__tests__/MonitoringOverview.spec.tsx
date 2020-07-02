import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Badge } from '@patternfly/react-core';
import { AlertStates } from '@console/internal/reducers/monitoring';
import { mockAlerts } from '@console/shared/src/utils/__mocks__/alerts-and-rules-data';
import MonitoringOverview from '../MonitoringOverview';
import { mockPodEvents, mockResourceEvents, mockPods } from './mockData';

describe('Monitoring Metric Section', () => {
  const monitoringOverviewProps: React.ComponentProps<typeof MonitoringOverview> = {
    resource: {
      metadata: {
        name: 'workload-name',
        namespace: 'test',
      },
      spec: {},
      status: {},
      kind: 'Deployment',
    },
    pods: mockPods,
    resourceEvents: mockResourceEvents,
    monitoringAlerts: mockAlerts.data,
    ...mockPodEvents,
  };

  let component: ShallowWrapper;
  beforeEach(() => {
    component = shallow(<MonitoringOverview {...monitoringOverviewProps} />);
  });

  it('metrics accordion should be expanded by default', () => {
    expect(component.find('#metrics').prop('isExpanded')).toBe(true);
    expect(component.find('#metrics-content').prop('isHidden')).toBe(false);
  });

  it('alerts accordion should expanded by default if there are firing alerts', () => {
    expect(component.find('#monitoring-alerts').prop('isExpanded')).toBe(true);
    expect(component.find('#monitoring-alerts-content').prop('isHidden')).toBe(false);
  });

  it('monitoring alerts should be 2', () => {
    expect(component.find(Badge).props().children).toBe(4);
  });

  it('alerts section should not be present if there are no firing alerts', () => {
    monitoringOverviewProps.monitoringAlerts[0].state = AlertStates.Pending;
    monitoringOverviewProps.monitoringAlerts[2].state = AlertStates.Pending;
    monitoringOverviewProps.monitoringAlerts[3].state = AlertStates.Pending;
    component = shallow(<MonitoringOverview {...monitoringOverviewProps} />);
    expect(component.find('#monitoring-alerts').exists()).toBe(false);
  });

  it('all events accordion should not be expanded by default', () => {
    expect(component.find('#all-events').prop('isExpanded')).toBe(false);
    expect(component.find('#all-events-content').prop('isHidden')).toBe(true);
  });

  it('should expand & collapse Metric Section accordion', () => {
    component.find('#metrics').simulate('click');
    expect(component.find('#metrics').prop('isExpanded')).toBe(false);
    expect(component.find('#metrics-content').prop('isHidden')).toBe(true);
    component.find('#metrics').simulate('click');
    expect(component.find('#metrics').prop('isExpanded')).toBe(true);
    expect(component.find('#metrics-content').prop('isHidden')).toBe(false);
  });
});
