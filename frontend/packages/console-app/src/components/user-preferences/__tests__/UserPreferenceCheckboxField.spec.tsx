import * as React from 'react';
import { Checkbox, Skeleton } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserSettings } from '@console/shared';
import UserPreferenceCheckboxField from '../UserPreferenceCheckboxField';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('UserPreferenceCheckboxField', () => {
  type UserPreferenceCheckboxFieldProps = React.ComponentProps<typeof UserPreferenceCheckboxField>;
  const props: UserPreferenceCheckboxFieldProps = {
    type: UserPreferenceFieldType.checkbox,
    id: 'id',
    userSettingsKey: '',
    label: 'label',
    trueValue: 'trueValue',
    falseValue: 'falseValue',
  };
  let wrapper: ShallowWrapper<UserPreferenceCheckboxFieldProps>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preferences have not loaded', () => {
    mockUserSettings.mockReturnValue(['', () => {}, false]);
    wrapper = shallow(<UserPreferenceCheckboxField {...props} />);
    expect(wrapper.find(Skeleton).exists()).toBeTruthy();
  });

  it('should render checkbox if user preferences have loaded', () => {
    mockUserSettings.mockReturnValue(['trueValue', () => {}, true]);
    wrapper = shallow(<UserPreferenceCheckboxField {...props} />);
    expect(wrapper.find(Checkbox).exists()).toBeTruthy();
  });

  it('should render with isChecked true if defaultValue is equal to trueValue and user preference has loaded but is not defined', () => {
    mockUserSettings.mockImplementation(() => {
      const [val, setVal] = React.useState('');
      return [val, setVal, true];
    });
    wrapper = shallow(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);
    expect(wrapper.find(Checkbox).props().isChecked).toBe(true);
  });

  it('should render with isChecked true if user preference has loaded and is equal to trueValue', () => {
    mockUserSettings.mockReturnValue(['trueValue', () => {}, true]);
    wrapper = shallow(<UserPreferenceCheckboxField {...props} defaultValue="falseValue" />);
    expect(wrapper.find(Checkbox).props().isChecked).toBe(true);
  });

  it('should render with isChecked false if user preference has loaded and is equal to falseValue', () => {
    mockUserSettings.mockReturnValue(['falseValue', () => {}, true]);
    wrapper = shallow(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);
    expect(wrapper.find(Checkbox).props().isChecked).toBe(false);
  });
});
