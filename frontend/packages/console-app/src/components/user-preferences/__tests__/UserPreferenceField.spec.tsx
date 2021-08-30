import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import UserPreferenceCheckboxField from '../UserPreferenceCheckboxField';
import UserPreferenceCustomField from '../UserPreferenceCustomField';
import UserPreferenceDropdownField from '../UserPreferenceDropdownField';
import UserPreferenceField from '../UserPreferenceField';
import {
  userPreferenceItemWithCheckboxField,
  userPreferenceItemWithCustomComponent,
  userPreferenceItemWithDropdownField,
  userPreferenceItemWithUnknownField,
} from './userPreferences.data';

describe('UserPreferenceField', () => {
  type UserPreferenceFieldProps = React.ComponentProps<typeof UserPreferenceField>;
  let wrapper: ShallowWrapper<UserPreferenceFieldProps>;

  it('should return with custom component if field type is custom', () => {
    wrapper = shallow(<UserPreferenceField item={userPreferenceItemWithCustomComponent} />);
    expect(wrapper.find(UserPreferenceCustomField).exists()).toBeTruthy();
  });

  it('should return with UserPreferenceDropdownField component if field type is dropdown', () => {
    wrapper = shallow(<UserPreferenceField item={userPreferenceItemWithDropdownField} />);
    expect(wrapper.find(UserPreferenceDropdownField).exists()).toBeTruthy();
  });

  it('should return with UserPreferenceCheckboxField component if field type is checkbox', () => {
    wrapper = shallow(<UserPreferenceField item={userPreferenceItemWithCheckboxField} />);
    expect(wrapper.find(UserPreferenceCheckboxField).exists()).toBeTruthy();
  });

  it('should return FormGroup with children as null if field type is of invalid or unknown', () => {
    wrapper = shallow(<UserPreferenceField item={userPreferenceItemWithUnknownField} />);
    expect(wrapper.find(FormGroup).props().children).toBeNull();
  });
});
