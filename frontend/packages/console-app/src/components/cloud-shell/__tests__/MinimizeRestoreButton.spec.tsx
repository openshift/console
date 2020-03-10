import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { OutlinedWindowMinimizeIcon, OutlinedWindowRestoreIcon } from '@patternfly/react-icons';
import MinimizeRestoreButton from '../MinimizeRestoreButton';

describe('MinimizeRestoreButton', () => {
  it('should render a button', () => {
    const wrapper = shallow(
      <MinimizeRestoreButton minimizeText="Minimize" restoreText="Restore" onClick={() => null} />,
    );
    expect(wrapper.find(Button).exists()).toEqual(true);
  });

  it('should render minimize button when minimized is true', () => {
    const wrapper = shallow(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize
        onClick={() => null}
      />,
    );
    expect(wrapper.find(OutlinedWindowMinimizeIcon).exists()).toEqual(true);
  });

  it('should render restore button when minimized is false', () => {
    const wrapper = shallow(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize={false}
        onClick={() => null}
      />,
    );
    expect(wrapper.find(OutlinedWindowRestoreIcon).exists()).toEqual(true);
  });

  it('should invoke onclose callback with argument true when minimized button clicked and false when restore button clicked', () => {
    const onClose = jest.fn();
    const wrapper = shallow(
      <MinimizeRestoreButton
        minimizeText="Minimize"
        restoreText="Restore"
        minimize
        onClick={onClose}
      />,
    );
    expect(wrapper.find(OutlinedWindowMinimizeIcon).exists()).toEqual(true);
    expect(wrapper.find(OutlinedWindowRestoreIcon).exists()).toEqual(false);
    // click on minimize button
    wrapper.find(Button).simulate('click');
    expect(onClose).toHaveBeenLastCalledWith(true);
    wrapper.setProps({ minimize: false });
    expect(wrapper.find(OutlinedWindowMinimizeIcon).exists()).toEqual(false);
    expect(wrapper.find(OutlinedWindowRestoreIcon).exists()).toEqual(true);
    // click on restore button
    wrapper.find(Button).simulate('click');
    expect(onClose).toHaveBeenLastCalledWith(false);
  });
});
