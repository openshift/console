import { shallow, ShallowWrapper } from 'enzyme';
import UserPreferenceInputCheckbox from '../UserPreferenceInputCheckbox';
import UserPreferenceInputDropdown from '../UserPreferenceInputDropdown';
import { createContentComponent } from '../utils/getTabContents';
import {
  userSettingsWithCheckboxInput,
  userSettingsWithCustomComponent,
  userSettingsWithDropdownInput,
  userSettingsWithUnknownInput,
} from './userPreferences.data';

describe('createContentComponent', () => {
  it('should return with custom component if it exists and is a valid React element', () => {
    const wrapper: ShallowWrapper = shallow(
      createContentComponent(userSettingsWithCustomComponent),
    );
    expect(wrapper.find('[data-test="test custom component"]').exists()).toBeTruthy();
  });

  it('should return with UserPreferenceInputDropdown component if input option type is dropdown', () => {
    const wrapper: ShallowWrapper = shallow(createContentComponent(userSettingsWithDropdownInput));
    expect(wrapper.find(UserPreferenceInputDropdown).exists()).toBeTruthy();
  });

  it('should return with UserPreferenceInputCheckbox component if input option type is checkbox', () => {
    const wrapper: ShallowWrapper = shallow(createContentComponent(userSettingsWithCheckboxInput));
    expect(wrapper.find(UserPreferenceInputCheckbox).exists()).toBeTruthy();
  });

  it('should return null if input option type is of invalid or unknown type and custom component is not available', () => {
    const nullComponent = createContentComponent(userSettingsWithUnknownInput);
    expect(nullComponent).toBeNull();
  });
});
