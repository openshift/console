import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import { shallow, ShallowWrapper } from 'enzyme';
import { SpecCapability, Descriptor } from '../types';
import { PodStatusChart, PodStatusChartProps } from './pods';

describe(PodStatusChart.displayName, () => {
  let wrapper: ShallowWrapper<PodStatusChartProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      path: 'size',
      displayName: 'Size',
      description: 'The desired number of member Pods for the etcd cluster.',
      'x-descriptors': [SpecCapability.podCount],
    };
    wrapper = shallow(<PodStatusChart subTitle={descriptor.path} statuses={{}} />);
  });

  it('renders a donut chart component with correct props', () => {
    expect(wrapper.find(ChartDonut).props().title).toEqual('0');
    expect(wrapper.find('[data-test-id="chart-donut-subtitle"]').text()).toEqual(descriptor.path);
  });

  it('passes data to donut chart', () => {
    const statuses = {
      ready: ['pod-0', 'pod-1'],
      starting: ['pod-2'],
    };
    wrapper = wrapper.setProps({ statuses });
    expect(wrapper.find(ChartDonut).props().data).toEqual([
      { label: '2 ready', x: 'ready', y: 2 },
      { label: '1 starting', x: 'starting', y: 1 },
    ]);
  });
});
