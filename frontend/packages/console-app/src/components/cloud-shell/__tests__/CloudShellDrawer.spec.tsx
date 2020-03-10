import * as React from 'react';
import { shallow } from 'enzyme';
import CloudShellDrawer from '../CloudShellDrawer';
import { Drawer } from '@console/shared';
import { Button } from '@patternfly/react-core';

describe('CloudShellDrawerComponent', () => {
  it('should not exist if open is not True', () => {
    const wrapper = shallow(<CloudShellDrawer open={false} onClose={() => null} />);
    expect(wrapper.isEmptyRender()).toEqual(true);
  });

  it('should exist when open is set to true', () => {
    const wrapper = shallow(<CloudShellDrawer open onClose={() => null} />);
    expect(wrapper.find(Drawer).exists()).toEqual(true);
  });

  it('should render children as Drawer children when present', () => {
    const wrapper = shallow(
      <CloudShellDrawer open onClose={() => null}>
        <p>Terminal content</p>
      </CloudShellDrawer>,
    );
    expect(
      wrapper
        .find(Drawer)
        .children()
        .html(),
    ).toEqual('<p>Terminal content</p>');
  });

  it('should call onClose when clicked on close button', () => {
    const onClose = jest.fn();
    const wrapper = shallow(
      <CloudShellDrawer open onClose={onClose}>
        <p>Terminal content</p>
      </CloudShellDrawer>,
    );
    const buttons = wrapper
      .find(Drawer)
      .shallow()
      .find(Button);
    expect(buttons.at(1).props()['aria-label']).toEqual('Close Terminal');
    buttons.at(1).simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
