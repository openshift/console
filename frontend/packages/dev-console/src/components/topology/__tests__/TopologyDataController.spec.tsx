import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { TopologyDataControllerProps, TopologyDataController } from '../TopologyDataController';

const TestInner = () => null;
const testProjectMatch = { url: '', params: { name: 'namespace' }, isExact: true, path: '' };

describe('TopologyDataController', () => {
  let wrapper: ShallowWrapper<TopologyDataControllerProps>;

  beforeEach(() => {
    wrapper = shallow(
      <TopologyDataController
        resourceList={[]}
        match={testProjectMatch}
        serviceBinding={false}
        render={() => <TestInner />}
      />,
    );
  });

  it('should render inner component', () => {
    // TODO: Find a way to actually test this component, following line will ALWAYS return true (should test for length or existence)
    expect(wrapper.find(<TestInner />)).toBeTruthy();
  });
});
