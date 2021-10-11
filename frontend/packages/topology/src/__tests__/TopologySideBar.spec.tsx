import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import CloseButton from '@console/shared/src/components/close-button';
import TopologySideBar from '../components/side-bar/TopologySideBar';

describe('TopologySideBar:', () => {
  const props = {
    show: true,
    onClose: () => '',
  };

  it('renders a SideBar', () => {
    const wrapper = shallow(<TopologySideBar {...props} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('clicking on close button should call the onClose callback function', () => {
    const onClose = jest.fn();
    const wrapper = shallow(<TopologySideBar show onClose={onClose} />);
    wrapper
      .find(CloseButton)
      .shallow()
      .find(Button)
      .simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
