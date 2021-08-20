import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import UserPreferenceField from '../UserPreferenceField';
import UserPreferenceForm from '../UserPreferenceForm';
import { mockUserPreferenceItems } from './userPreferences.data';

describe('UserPreferenceForm', () => {
  type UserPreferenceFormProps = React.ComponentProps<typeof UserPreferenceForm>;
  let wrapper: ShallowWrapper<UserPreferenceFormProps>;

  it('should return null if items array is empty', () => {
    wrapper = shallow(<UserPreferenceForm items={[]} />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should return Form with UserPreferenceFields if items array is not empty', () => {
    wrapper = shallow(<UserPreferenceForm items={mockUserPreferenceItems} />);
    expect(wrapper.find(Form).exists()).toBeTruthy();
    expect(wrapper.find(UserPreferenceField).exists()).toBeTruthy();
    expect(wrapper.find(UserPreferenceField)).toHaveLength(mockUserPreferenceItems.length);
  });
});
