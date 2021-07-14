import * as React from 'react';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export enum UserPreferencesInputType {
  dropdown = 'dropdown',
  checkbox = 'checkbox',
}

export type DropdownOption = {
  type: UserPreferencesInputType.dropdown;
  options: {
    value: string;
    label: string;
  }[];
};
export type CheckboxOption = {
  type: UserPreferencesInputType.checkbox;
  trueValue: string;
  falseValue: string;
};
export type UserSettingInputOptions = DropdownOption | CheckboxOption;

export type UserSettings = ExtensionDeclaration<
  'console.user-settings',
  {
    /** ID used to identify the user setting. The value for ID is the key for the user setting in config map */
    id: string;
    /** IDs used to identify the user setting groups the user setting would belong to. */
    groupId?: string;
    /** The label of the user setting */
    label: string;
    /** The description of the user setting. */
    description: string;
    /** The input field options used to render the values to set the user setting. */
    inputOption?: UserSettingInputOptions;
    /** Custom component to set the user setting. */
    customComponent?: CodeRef<React.ReactElement>;
    /** ID of user setting before which this user setting should be placed */
    insertBefore?: string;
    /** ID of user setting after which this user setting should be placed */
    insertAfter?: string;
  }
>;

export type UserSettingsGroup = ExtensionDeclaration<
  'console.user-settings/group',
  {
    /** ID used to identify the user setting group. */
    id: string;
    /** The label of the user setting group */
    label: string;
    /** ID of user setting group before which this group should be placed */
    insertBefore?: string;
    /** ID of user setting group after which this group should be placed */
    insertAfter?: string;
  }
>;

// Type guards

export const isUserSettings = (e: Extension): e is UserSettings => {
  return e.type === 'console.user-settings';
};

export const isUserSettingsGroup = (e: Extension): e is UserSettingsGroup => {
  return e.type === 'console.user-settings/group';
};
