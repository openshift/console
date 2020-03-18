import * as React from 'react';
import { shallow } from 'enzyme';
import CloudShellDrawer from '../CloudShellDrawer';
import { Drawer } from '@console/shared';

describe('CloudShellDrawerComponent', () => {
  it('should render children as Drawer children when present', () => {
    const wrapper = shallow(
      <CloudShellDrawer onClose={() => null}>
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
      <CloudShellDrawer onClose={onClose}>
        <p>Terminal content</p>
      </CloudShellDrawer>,
    );
    const closeButton = wrapper
      .find(Drawer)
      .shallow()
      .find('[data-test-id="cloudshell-terminal-close"]');
    expect(closeButton.props()['aria-label']).toEqual('Close terminal');
    closeButton.simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
