import * as React from 'react';
import {
  ResolvedExtension,
  UserPreferenceFieldType,
  UserPreferenceGroup,
  UserPreferenceItem,
} from '@console/dynamic-plugin-sdk';
import { ResolvedUserPreferenceItem, ResolvedUserPreferenceGroup } from '../types';

export const userPreferenceItemWithCustomComponent: ResolvedUserPreferenceItem = {
  id: 'console.preferredNamespace',
  groupId: 'general',
  label: 'Project',
  description: '',
  field: {
    type: UserPreferenceFieldType.custom,
    component: () => <span data-test="test custom1 component" />,
  },
};

export const userPreferenceItemWithDropdownField: ResolvedUserPreferenceItem = {
  id: 'console.preferredPerspective',
  groupId: 'general',
  label: 'Perspective',
  field: {
    type: UserPreferenceFieldType.dropdown,
    userSettingsKey: 'console.preferredPerspective',
    defaultValue: 'latest',
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

export const userPreferenceItemWithCheckboxField: ResolvedUserPreferenceItem = {
  id: 'console.preferredDateAndTimeSelection',
  groupId: 'language',
  label: 'Date and time selections',
  field: {
    type: UserPreferenceFieldType.checkbox,
    userSettingsKey: 'console.preferredDateAndTimeSelection',
    label: 'Automatically set date format, time format and time zone',
    trueValue: 'automatic',
    falseValue: 'manual',
  },
  description: '',
};

export const userPreferenceItemWithUnknownField: ResolvedUserPreferenceItem = {
  id: 'console.unknown',
  label: 'Unknown Input',
  field: {
    type: 'text' as any,
    userSettingsKey: 'console.unknown',
    label: 'This is an invalid input type',
    trueValue: 'Invalid true messsage',
    falseValue: 'Invalid false message',
  },
  description: '',
};

export const userPreferenceGroupGeneral: ResolvedUserPreferenceGroup = {
  id: 'general',
  label: 'General',
};

export const userPreferenceGroupLanguage: ResolvedUserPreferenceGroup = {
  id: 'language',
  label: 'Language & Region',
};

export const userPreferenceGroupEmpty: ResolvedUserPreferenceGroup = {
  id: 'everEmpty',
  label: 'Empty',
};

export const mockUserPreferenceItems: ResolvedUserPreferenceItem[] = [
  userPreferenceItemWithCustomComponent,
  userPreferenceItemWithDropdownField,
  userPreferenceItemWithCheckboxField,
];

export const mockUserPreferenceGroups: ResolvedUserPreferenceGroup[] = [
  userPreferenceGroupGeneral,
  userPreferenceGroupLanguage,
];

export const mockUserPreferenceItemExtensions: ResolvedExtension<
  UserPreferenceItem
>[] = mockUserPreferenceItems.map((userPreferenceItem) => ({
  type: 'console.user-preference/item',
  pluginID: '',
  pluginName: '',
  uid: '',
  properties: userPreferenceItem,
}));

export const mockUserPreferenceGroupExtensions: ResolvedExtension<
  UserPreferenceGroup
>[] = mockUserPreferenceGroups.map((userPreferenceGroup) => ({
  type: 'console.user-preference/group',
  pluginID: '',
  pluginName: '',
  uid: '',
  properties: userPreferenceGroup,
}));
