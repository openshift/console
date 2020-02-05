import * as React from 'react';
import { shallow } from 'enzyme';
import { PodCount } from '../MonitoringDashboardPodCount';
import { LoadingInline } from '@console/internal/components/utils';
import { samplePods } from '../../../topology/__tests__/topology-test-data';

let podCountProps: React.ComponentProps<typeof PodCount>;

describe('MonitoringDashboardPodCount', () => {
  beforeEach(() => {
    podCountProps = {
      pods: {
        loaded: false,
        loadError: '',
        data: [],
      },
    };
  });

  it('should render LoadingInline', () => {
    const wrapper = shallow(<PodCount {...podCountProps} />);
    expect(wrapper.find(LoadingInline).exists()).toBe(true);
  });

  it('should show pod count', () => {
    podCountProps.pods.loaded = true;
    podCountProps.pods = samplePods;
    const wrapper = shallow(<PodCount {...podCountProps} />);
    expect(wrapper.find('h1').props().children).toEqual(10);
  });
});
