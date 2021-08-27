import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import UserPreferenceCustomField from '../UserPreferenceCustomField';

describe('UserPreferenceCustomField', () => {
  type UserPreferenceCustomFieldProps = React.ComponentProps<typeof UserPreferenceCustomField>;
  const props: UserPreferenceCustomFieldProps = {
    type: UserPreferenceFieldType.custom,
    id: 'id',
    component: (componentProps) => <span {...componentProps} />,
    props: { 'data-test': 'test custom component' },
  };
  let wrapper: ShallowWrapper<UserPreferenceCustomFieldProps>;

  it('should render null if component does not exist', () => {
    wrapper = shallow(<UserPreferenceCustomField {...props} component={null} />);
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(wrapper.find('[data-test="test custom component"]').exists()).toBeFalsy();
  });

  it('should render custom component with custom props if component exists', () => {
    wrapper = shallow(<UserPreferenceCustomField {...props} />);
    expect(wrapper.find('[data-test="test custom component"]').exists()).toBeTruthy();
  });
});
