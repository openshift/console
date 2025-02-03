import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { AlertStates } from '@console/dynamic-plugin-sdk';
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
    expect(component.find('#metrics-accordian-item').prop('isExpanded')).toBe(true);
  });

  it('alerts accordion should expanded by default if there are firing alerts', () => {
    expect(component.find('#monitoring-alerts-accordian-item').prop('isExpanded')).toBe(true);
  });

  it('monitoring alerts should be 5', () => {
    expect(component.find(Badge).props().children).toBe(5);
  });

  it('alerts section should not be present if there are no firing alerts', () => {
    monitoringOverviewProps.monitoringAlerts[0].state = AlertStates.Pending;
    monitoringOverviewProps.monitoringAlerts[2].state = AlertStates.Pending;
    monitoringOverviewProps.monitoringAlerts[3].state = AlertStates.Pending;
    monitoringOverviewProps.monitoringAlerts[4].state = AlertStates.Pending;
    component = shallow(<MonitoringOverview {...monitoringOverviewProps} />);
    expect(component.find('#monitoring-alerts').exists()).toBe(false);
  });

  it('all events accordion should not be expanded by default', () => {
    expect(component.find('#all-events-accordian-item').prop('isExpanded')).toBe(false);
  });

  it('should expand & collapse Metric Section accordion', () => {
    component.find('#metrics').simulate('click');
    expect(component.find('#metrics-accordian-item').prop('isExpanded')).toBe(false);
    component.find('#metrics').simulate('click');
    expect(component.find('#metrics-accordian-item').prop('isExpanded')).toBe(true);
  });
});
