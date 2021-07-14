import * as React from 'react';
import { Checkbox, Skeleton } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useUserSettings } from '@console/shared';
import UserPreferenceInputCheckbox from '../UserPreferenceInputCheckbox';

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

describe('UserPreferenceInputCheckbox', () => {
  type UserPreferenceInputCheckboxProps = React.ComponentProps<typeof UserPreferenceInputCheckbox>;
  const props: UserPreferenceInputCheckboxProps = {
    id: 'id',
    userSettingKey: '',
    description: 'description',
    trueValue: 'trueValue',
    falseValue: 'falseValue',
  };
  let wrapper: ShallowWrapper<UserPreferenceInputCheckboxProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user settings have not loaded', () => {
    mockUserSettings.mockReturnValue(['', () => {}, false]);
    wrapper = shallow(<UserPreferenceInputCheckbox {...props} />);
    expect(wrapper.find(Skeleton).exists()).toBeTruthy();
  });

  it('should render checkbox if user settings have not loaded', () => {
    mockUserSettings.mockReturnValue(['value', () => {}, true]);
    wrapper = shallow(<UserPreferenceInputCheckbox {...props} />);
    expect(wrapper.find(Checkbox).exists()).toBeTruthy();
  });
});
