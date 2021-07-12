import * as React from 'react';
import {
  ResolvedExtension,
  UserPreferencesInputType,
  UserSettings,
  UserSettingsGroup,
} from '@console/dynamic-plugin-sdk';
import { ResolvedUserSettings, ResolvedUserSettingsGroup } from '../types';

export const userSettingsWithCustomComponent: ResolvedUserSettings = {
  id: 'console.preferredNamespace',
  groupId: 'general',
  label: 'Project',
  customComponent: <span data-test="test custom component" />,
  description: '',
};

export const userSettingsWithDropdownInput: ResolvedUserSettings = {
  id: 'console.preferredPerspective',
  groupId: 'general',
  label: 'Perspective',
  inputOption: {
    type: UserPreferencesInputType.dropdown,
    options: [
      {
        value: 'dev',
        label: 'Developer',
      },
      {
        value: 'admin',
        label: 'Administrator',
      },
    ],
  },
  description: '',
};

export const userSettingsWithCheckboxInput: ResolvedUserSettings = {
  id: 'console.preferredDateAndTimeSelection',
  groupId: 'language',
  label: 'Date and time selections',
  inputOption: {
    type: UserPreferencesInputType.checkbox,
    trueValue: 'automatic',
    falseValue: 'manual',
  },
  description: '',
};

export const userSettingsWithUnknownInput: ResolvedUserSettings = {
  id: 'console.unknown',
  label: 'Unknown Input',
  inputOption: {
    type: 'text' as UserPreferencesInputType.checkbox,
    trueValue: 'This is an invalid input type',
    falseValue: 'Invalid false message',
  },
  description: '',
};

export const userSettingsGroupGeneral: ResolvedUserSettingsGroup = {
  id: 'general',
  label: 'General',
};

export const userSettingsGroupLanguage: ResolvedUserSettingsGroup = {
  id: 'language',
  label: 'Language & Region',
};

export const userSettingsGroupEmpty: ResolvedUserSettingsGroup = {
  id: 'everEmpty',
  label: 'Empty',
};

export const mockUserSettings: ResolvedUserSettings[] = [
  userSettingsWithCustomComponent,
  userSettingsWithDropdownInput,
  userSettingsWithCheckboxInput,
];

export const mockUserSettingsGroups: ResolvedUserSettingsGroup[] = [
  userSettingsGroupGeneral,
  userSettingsGroupLanguage,
];

export const userSettingsExtensions: ResolvedExtension<UserSettings>[] = mockUserSettings.map(
  (userSetting) => ({
    type: 'console.user-settings',
    pluginID: '',
    pluginName: '',
    uid: '',
    properties: userSetting,
  }),
);

export const userSettingsGroupExtensions: ResolvedExtension<
  UserSettingsGroup
>[] = mockUserSettingsGroups.map((userSettingGroup) => ({
  type: 'console.user-settings/group',
  pluginID: '',
  pluginName: '',
  uid: '',
  properties: userSettingGroup,
}));
