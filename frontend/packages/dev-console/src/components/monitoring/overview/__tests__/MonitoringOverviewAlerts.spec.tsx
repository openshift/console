import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { sortMonitoringAlerts } from '@console/shared';
import {
  mockAlerts,
  expectedSortedAlerts,
} from '@console/shared/src/utils/__mocks__/alerts-and-rules-data';
import { InternalMonitoringOverviewAlerts as MonitoringOverviewAlerts } from '../MonitoringOverviewAlerts';

describe('Monitoring Alerts Section', () => {
  const monitoringOverviewProps: React.ComponentProps<typeof MonitoringOverviewAlerts> = {
    alerts: mockAlerts.data,
  };

  it('should show alerts sorted by severity', () => {
    const sortedAlerts = sortMonitoringAlerts(mockAlerts.data);
    expect(sortedAlerts).toEqual(expectedSortedAlerts);
  });

  it('should show Alert according to Severity', () => {
    const component = shallow(<MonitoringOverviewAlerts {...monitoringOverviewProps} />);
    expect(
      component
        .find(Alert)
        .at(0)
        .prop('variant'),
    ).toBe('danger');
    expect(
      component
        .find(Alert)
        .at(1)
        .prop('variant'),
    ).toBe('warning');
    expect(
      component
        .find(Alert)
        .at(2)
        .prop('variant'),
    ).toBe('warning');
  });
});
