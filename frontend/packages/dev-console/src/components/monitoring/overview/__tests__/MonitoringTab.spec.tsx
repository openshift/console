import * as React from 'react';
import { shallow } from 'enzyme';
import MonitoringTab from '../MonitoringTab';
import MonitoringMetricsSection from '../MonitoringMetricsSection';

describe('Monitoring Tab', () => {
  const monTabProps: React.ComponentProps<typeof MonitoringTab> = {
    item: {
      obj: {
        metadata: {
          name: 'workload-name',
          namespace: 'test',
        },
        kind: 'Deployment',
        status: {},
        spec: {
          selector: {},
          template: {
            metadata: {},
            spec: {
              containers: [],
            },
          },
        },
      },
      buildConfigs: [],
      routes: [],
      services: [],
    },
  };

  it('should render Monitoring tab with Metrics section for selected workload', () => {
    const component = shallow(<MonitoringTab {...monTabProps} />);
    expect(component.find(MonitoringMetricsSection).exists()).toBe(true);
  });
});
