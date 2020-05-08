import * as React from 'react';
import { shallow } from 'enzyme';
import { LoadingBox } from '@console/internal/components/utils';
import CloudShellTerminalFrame from '../CloudShellTerminalFrame';

describe('CloudShellTerminalFrame', () => {
  it('should render LoadingBox', () => {
    const wrapper = shallow(<CloudShellTerminalFrame loading />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
    expect(wrapper.find('iframe').exists()).toBe(false);

    wrapper.setProps({ loading: false });
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });
});
