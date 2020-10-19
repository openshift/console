import * as React from 'react';
import { shallow } from 'enzyme';
import { CloseButton } from '@console/internal/components/utils';
import { TopologySideBar, TopologySideBarProps } from '../TopologySideBar';

describe('TopologySideBar:', () => {
  const props: TopologySideBarProps = {
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
      .find('button')
      .simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
