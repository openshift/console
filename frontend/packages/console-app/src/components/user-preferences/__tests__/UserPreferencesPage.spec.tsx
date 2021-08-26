import * as React from 'react';
import { Tabs } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { LoadingBox } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import UserPreferencePage from '../UserPreferencePage';
import {
  mockUserPreferenceGroupExtensions,
  mockUserPreferenceItemExtensions,
} from './userPreferences.data';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

const useExtensionsMock = useExtensions as jest.Mock;
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

describe('UserPreferencePage', () => {
  type UserPreferencePageProps = React.ComponentProps<typeof UserPreferencePage>;
  let props: UserPreferencePageProps;
  let wrapper: ShallowWrapper<UserPreferencePageProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shoud render with default user preference group based on the url params', () => {
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, true]);
    props = {
      history: null,
      location: null,
      match: {
        isExact: true,
        path: '/user-preferences',
        url: '/user-preferences',
        params: {
          group: 'language',
        },
      },
    };

    wrapper = shallow(<UserPreferencePage {...props} />);

    expect(wrapper.find('[data-test="tab language"]').exists()).toBeTruthy();
    expect(wrapper.find(Tabs).props().activeKey).toEqual('language');
  });

  it('shoud render with "general" user preference group as default if url params does not provide a group', () => {
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, true]);
    props = {
      history: null,
      location: null,
      match: {
        isExact: true,
        path: '/user-preferences',
        url: '/user-preferences',
        params: {
          group: '',
        },
      },
    };

    wrapper = shallow(<UserPreferencePage {...props} />);

    expect(wrapper.find('[data-test="tab general"]').exists()).toBeTruthy();
    expect(wrapper.find(Tabs).props().activeKey).toEqual('general');
  });

  it('should render loading box if user preferece extensions have not resolved', () => {
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, false]);
    props = {
      history: null,
      location: null,
      match: {
        isExact: true,
        path: '/user-preferences',
        url: '/user-preferences',
        params: {
          group: '',
        },
      },
    };

    wrapper = shallow(<UserPreferencePage {...props} />);

    expect(wrapper.find(LoadingBox).exists()).toBeTruthy();
  });
});
