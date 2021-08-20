import * as React from 'react';
import { Select } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserSettings } from '@console/shared';
import UserPreferenceDropdownField from '../UserPreferenceDropdownField';

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

describe('UserPreferenceDropdownField', () => {
  type UserPreferenceDropdownFieldProps = React.ComponentProps<typeof UserPreferenceDropdownField>;
  const props: UserPreferenceDropdownFieldProps = {
    type: UserPreferenceFieldType.dropdown,
    id: 'id',
    userSettingsKey: '',
    options: [
      { value: 'value', label: 'label' },
      { value: '#LATEST#', label: 'Last viewed' },
    ],
  };
  let wrapper: ShallowWrapper<UserPreferenceDropdownFieldProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preference have not loaded', () => {
    mockUserSettings.mockReturnValue(['', () => {}, false]);
    wrapper = shallow(<UserPreferenceDropdownField {...props} />);
    expect(wrapper.find('[data-test="dropdown skeleton id"]').exists()).toBeTruthy();
  });

  it('should render select with selected value corresponding to user preference if it has loaded and is defined', () => {
    mockUserSettings.mockReturnValue(['value', () => {}, true]);
    wrapper = shallow(<UserPreferenceDropdownField {...props} />);
    expect(wrapper.find('[data-test="dropdown id"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toBe('label');
  });

  it('should render select with selected value corresponding to defaultValue if user preference has loaded and is undefined', () => {
    mockUserSettings.mockImplementation(() => {
      const [val, setVal] = React.useState('');
      return [val, setVal, true];
    });
    wrapper = shallow(<UserPreferenceDropdownField {...props} defaultValue="#LATEST#" />);
    expect(wrapper.find('[data-test="dropdown id"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toBe('Last viewed');
  });
});
