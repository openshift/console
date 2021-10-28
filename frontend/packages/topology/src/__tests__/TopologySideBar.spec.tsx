import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { useUserSettings } from '@console/shared';
import CloseButton from '@console/shared/src/components/close-button';
import TopologySideBar from '../components/side-bar/TopologySideBar';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('TopologySideBar:', () => {
  const props = {
    show: true,
    onClose: () => '',
  };

  it('renders a SideBar', () => {
    mockUserSettings.mockReturnValue([100, () => {}, true]);
    const wrapper = shallow(<TopologySideBar {...props} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('clicking on close button should call the onClose callback function', () => {
    mockUserSettings.mockReturnValue([100, () => {}, true]);
    const onClose = jest.fn();
    const wrapper = shallow(<TopologySideBar onClose={onClose} />);
    wrapper
      .find(CloseButton)
      .shallow()
      .find(Button)
      .simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
