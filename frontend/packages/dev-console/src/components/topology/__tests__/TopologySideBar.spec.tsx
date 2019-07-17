import * as React from 'react';
import { shallow } from 'enzyme';
import { CloseButton } from '@console/internal/components/utils';
import SideBar, { TopologySideBarProps } from '../TopologySideBar';

describe('TopologySideBar:', () => {
  const props: TopologySideBarProps = {
    show: true,
    item: {
      resources: [{ kind: 'DeploymentConfig' }, { kind: 'Route' }, { kind: 'Service' }],
      data: {},
    } as any,
    onClose: () => '',
  };

  it('renders a SideBar', () => {
    const wrapper = shallow(<SideBar {...props} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('clicking on close button should call the onClose callback function', () => {
    const onClose = jest.fn();
    const wrapper = shallow(<SideBar show item={props.item} onClose={onClose} />);
    wrapper
      .find(CloseButton)
      .shallow()
      .find('button')
      .simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
