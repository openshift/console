import * as React from 'react';
import { Tabs } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { LoadingBox } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import UserPreferences from '../UserPreferences';
import { userSettingsExtensions, userSettingsGroupExtensions } from './userPreferences.data';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

const useExtensionsMock = useExtensions as jest.Mock;
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

describe('UserPreferences', () => {
  type UserPreferencesProps = React.ComponentProps<typeof UserPreferences>;
  let props: UserPreferencesProps;
  let wrapper: ShallowWrapper<UserPreferencesProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shoud render default user settings group based on the url params', () => {
    useExtensionsMock.mockReturnValue(userSettingsGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([userSettingsExtensions, true]);
    props = {
      history: null,
      location: null,
      match: {
        isExact: true,
        path: '/user-preferences',
        url: '/user-preferences',
        params: {
          category: 'language',
        },
      },
    };

    wrapper = shallow(<UserPreferences {...props} />);

    expect(wrapper.find('[data-test="userPreferenceTab language"]').exists()).toBeTruthy();
    expect(wrapper.find(Tabs).props().activeKey).toEqual('language');
  });

  it('shoud render "general" user settings group as default', () => {
    useExtensionsMock.mockReturnValue(userSettingsGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([userSettingsExtensions, true]);
    props = {
      history: null,
      location: null,
      match: {
        isExact: true,
        path: '/user-preferences',
        url: '/user-preferences',
        params: {
          category: '',
        },
      },
    };

    wrapper = shallow(<UserPreferences {...props} />);

    expect(wrapper.find('[data-test="userPreferenceTab general"]').exists()).toBeTruthy();
    expect(wrapper.find(Tabs).props().activeKey).toEqual('general');
  });

  it('should render loading box if userSettings have not resolved', () => {
    useExtensionsMock.mockReturnValue(userSettingsGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([userSettingsExtensions, false]);
    props = {
      history: null,
      location: null,
      match: {
        isExact: true,
        path: '/user-preferences',
        url: '/user-preferences',
        params: {
          category: '',
        },
      },
    };

    wrapper = shallow(<UserPreferences {...props} />);

    expect(wrapper.find(LoadingBox).exists()).toBeTruthy();
  });
});
