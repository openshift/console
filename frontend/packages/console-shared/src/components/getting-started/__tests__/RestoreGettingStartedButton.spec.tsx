import * as React from 'react';
import { shallow } from 'enzyme';
import { RestoreGettingStartedButton } from '../RestoreGettingStartedButton';
import { useGettingStartedShowState, GettingStartedShowState } from '../useGettingStartedShowState';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  // Set useLayoutEffect to useEffect to solve react warning
  // "useLayoutEffect does nothing on the server, ..." while
  // running this test. useLayoutEffect was used internally by
  // the PatternFly Label for a tooltip.
  useLayoutEffect: require.requireActual('react').useEffect,
}));

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key) => key.split('~')[1] }),
}));

jest.mock('../useGettingStartedShowState', () => ({
  ...require.requireActual('../useGettingStartedShowState'),
  useGettingStartedShowState: jest.fn(),
}));

// Workaround because getting-started exports also useGettingStartedShowState
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('RestoreGettingStartedButton', () => {
  it('should render nothing if getting started is shown', () => {
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    const wrapper = shallow(<RestoreGettingStartedButton userSettingsKey="test" />);

    expect(wrapper.render().text()).toEqual('');
  });

  it('should render button if getting started is hidden', () => {
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    const wrapper = shallow(<RestoreGettingStartedButton userSettingsKey="test" />);

    expect(wrapper.render().text()).toEqual('Show getting started resources');
  });

  it('should change user settings to show if button is pressed', () => {
    const setGettingStartedShowState = jest.fn();
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.HIDE,
      setGettingStartedShowState,
      true,
    ]);

    const wrapper = shallow(<RestoreGettingStartedButton userSettingsKey="test" />).shallow();

    wrapper.simulate('click');

    expect(setGettingStartedShowState).toHaveBeenCalledTimes(1);
    expect(setGettingStartedShowState).toHaveBeenLastCalledWith(GettingStartedShowState.SHOW);
  });

  it('should change user settings to disappear if x on the button is pressed', () => {
    const setGettingStartedShowState = jest.fn();
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.HIDE,
      setGettingStartedShowState,
      true,
    ]);

    const wrapper = shallow(<RestoreGettingStartedButton userSettingsKey="test" />).shallow();

    // TimesIcon is an x which is used by the PatternFly Label component to 'close' the label.
    wrapper
      .find('TimesIcon')
      .parent()
      .simulate('click', { preventDefault: jest.fn(), stopPropagation: jest.fn() });

    expect(setGettingStartedShowState).toHaveBeenCalledTimes(1);
    expect(setGettingStartedShowState).toHaveBeenLastCalledWith(GettingStartedShowState.DISAPPEAR);
  });

  it('should render nothing if getting started is hidden and the button is disappeared', () => {
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.DISAPPEAR,
      jest.fn(),
      true,
    ]);

    const wrapper = shallow(<RestoreGettingStartedButton userSettingsKey="test" />);

    expect(wrapper.render().text()).toEqual('');
  });
});
