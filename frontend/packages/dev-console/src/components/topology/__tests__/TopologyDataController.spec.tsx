import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { TopologyDataControllerProps, TopologyDataController } from '../TopologyDataController';
import { resources } from './topology-test-data';

const TestInner = () => null;

describe('TopologyDataController', () => {
  const props = {
    namespace: 'test',
    resources,
    knative: false,
    serviceBinding: false,
    cheURL: 'https://test-che.test-cluster.com',
    render: () => <TestInner />,
  };
  let wrapper: ShallowWrapper<TopologyDataControllerProps>;

  beforeEach(() => {
    wrapper = shallow(
      <TopologyDataController
        resourceList={[]}
        application={undefined}
        namespace="namespace"
        filters={{
          display: {
            podCount: true,
            eventSources: true,
            knativeServices: true,
            appGrouping: true,
            operatorGrouping: true,
            helmGrouping: true,
          },
          searchQuery: null,
        }}
        {...props}
      />,
    );
  });

  it('should render inner component', () => {
    expect(wrapper.find(<TestInner />)).toBeTruthy();
  });
});
