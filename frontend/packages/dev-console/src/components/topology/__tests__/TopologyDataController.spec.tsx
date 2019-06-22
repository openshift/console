import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import TopologyDataController, { TopologyDataControllerProps } from '../TopologyDataController';
import { resources } from './topology-test-data';

const TestInner = () => null;

describe('TopologyDataController', () => {
  const props = {
    namespace: 'test',
    resources,
    knative: false,
    render: () => <TestInner />,
  };
  let wrapper: ShallowWrapper<TopologyDataControllerProps>;

  beforeEach(() => {
    wrapper = shallow(
      <TopologyDataController application={undefined} namespace="namespace" {...props} />,
    );
  });

  it('should render inner component', () => {
    expect(wrapper.find(<TestInner />)).toBeTruthy();
  });
});
