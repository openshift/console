import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { UserPreferencesInputType } from '@console/dynamic-plugin-sdk';
import { ResolvedUserSettings } from '../types';
import UserPreferenceInputCheckbox from '../UserPreferenceInputCheckbox';
import UserPreferenceInputDropdown from '../UserPreferenceInputDropdown';

export const createContentComponent = (userSettingsExtension: ResolvedUserSettings) => {
  const { id, label, inputOption, customComponent, description } = userSettingsExtension;

  if (customComponent && React.isValidElement(customComponent)) {
    return (
      <FormGroup key={id} fieldId={id} label={label} helperText={description} data-test={id}>
        {customComponent}
      </FormGroup>
    );
  }

  if (inputOption.type === UserPreferencesInputType.dropdown) {
    return (
      <FormGroup key={id} fieldId={id} label={label} helperText={description} data-test={id}>
        <UserPreferenceInputDropdown
          id={id}
          label={label}
          userSettingKey={id}
          dropdownOptions={inputOption.options}
        />
      </FormGroup>
    );
  }

  if (inputOption.type === UserPreferencesInputType.checkbox) {
    const { trueValue, falseValue } = inputOption;
    return (
      <FormGroup key={id} fieldId={id} label={label} data-test={id}>
        <UserPreferenceInputCheckbox
          id={id}
          userSettingKey={id}
          description={description}
          trueValue={trueValue}
          falseValue={falseValue}
        />
      </FormGroup>
    );
  }
  return null;
};

export const getTabContents = (items: ResolvedUserSettings[]) =>
  items.map((item) => createContentComponent(item));
