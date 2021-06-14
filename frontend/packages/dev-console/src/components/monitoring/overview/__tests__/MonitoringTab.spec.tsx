import * as React from 'react';
import { shallow } from 'enzyme';
import MonitoringOverview from '../MonitoringOverview';
import MonitoringTab from '../MonitoringTab';

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    usePodsWatcher: () => {
      return {
        loaded: true,
        loadError: '',
        podData: {},
      };
    },
  };
});

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
    },
  };

  it('should render Monitoring tab with Metrics section for selected workload', () => {
    const component = shallow(<MonitoringTab {...monTabProps} />);
    expect(component.find(MonitoringOverview).exists()).toBe(true);
  });
});
