/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { SpecCapability, Descriptor } from '../../../../../public/components/operator-lifecycle-manager/descriptors/types';
import { PodStatusChart, PodStatusChartProps } from '../../../../../public/components/operator-lifecycle-manager/descriptors/status/pods';
import { Donut } from '../../../../../public/components/graphs';

describe(PodStatusChart.displayName, () => {
  let wrapper: ShallowWrapper<PodStatusChartProps>;
  let descriptor: Descriptor;

  beforeEach(() => {
    descriptor = {
      'path': 'size',
      'displayName': 'Size',
      'description': 'The desired number of member Pods for the etcd cluster.',
      'x-descriptors': [SpecCapability.podCount],
    };
    wrapper = shallow(<PodStatusChart statusDescriptor={descriptor} fetcher={() => null} />);
  });

  it('renders a donut chart component with correct props', () => {
    expect(wrapper.find(Donut).props().kind).toEqual(descriptor.path);
    expect(wrapper.find(Donut).props().title).toEqual(descriptor.displayName);
  });

  it('passes `fetch` function to donut chart which returns a promise which resolves to chart data', (done) => {
    const fetcher = () => ({
      ready: ['pod-0', 'pod-1'],
      starting: ['pod-2'],
    });
    wrapper = wrapper.setProps({fetcher});

    wrapper.find(Donut).props().fetch().then(([values, labels]) => {
      expect(values).toEqual([2, 1]);
      expect(labels).toEqual(['ready', 'starting']);
      done();
    });
  });
});
