import * as React from 'react';
import { Tabs } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { LoadingBox } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import { useQueryParams } from '@console/shared/src';
import UserPreferencePage from '../UserPreferencePage';
import {
  mockUserPreferenceGroupExtensions,
  mockUserPreferenceItemExtensions,
} from './userPreferences.data';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useQueryParams', () => ({
  useQueryParams: jest.fn(),
}));

const useExtensionsMock = useExtensions as jest.Mock;
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;
const useQueryParamsMock = useQueryParams as jest.Mock;

describe('UserPreferencePage', () => {
  type UserPreferencePageProps = React.ComponentProps<typeof UserPreferencePage>;
  let wrapper: ShallowWrapper<UserPreferencePageProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shoud render with default user preference group based on the url params', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      group: 'language',
    });
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams());

    wrapper = shallow(<UserPreferencePage />);

    expect(wrapper.find('[data-test="tab language"]').exists()).toBeTruthy();
    expect(wrapper.find(Tabs).props().activeKey).toEqual('language');
  });

  it('shoud render with "general" user preference group as default if url params does not provide a group', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams());

    wrapper = shallow(<UserPreferencePage />);

    expect(wrapper.find('[data-test="tab general"]').exists()).toBeTruthy();
    expect(wrapper.find(Tabs).props().activeKey).toEqual('general');
  });

  it('should render loading box if user preferece extensions have not resolved', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, false]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams());

    wrapper = shallow(<UserPreferencePage />);

    expect(wrapper.find(LoadingBox).exists()).toBeTruthy();
  });
});
