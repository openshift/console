import * as React from 'react';
import { Select, Skeleton } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useUserSettings } from '@console/shared';
import UserPreferenceInputDropdown from '../UserPreferenceInputDropdown';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('UserPreferenceInputDropdown', () => {
  type UserPreferenceInputDropdownProps = React.ComponentProps<typeof UserPreferenceInputDropdown>;
  const props: UserPreferenceInputDropdownProps = {
    id: 'id',
    label: 'Label',
    userSettingKey: '',
    dropdownOptions: [{ value: 'value', label: 'label' }],
  };
  let wrapper: ShallowWrapper<UserPreferenceInputDropdownProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user settings have not loaded', () => {
    mockUserSettings.mockReturnValue(['', () => {}, false]);
    wrapper = shallow(<UserPreferenceInputDropdown {...props} />);
    expect(wrapper.find(Skeleton).exists()).toBeTruthy();
  });

  it('should render select if user settings have not loaded', () => {
    mockUserSettings.mockReturnValue(['value', () => {}, true]);
    wrapper = shallow(<UserPreferenceInputDropdown {...props} />);
    expect(wrapper.find(Select).exists()).toBeTruthy();
  });
});
