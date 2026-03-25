import type { ComponentType } from 'react';
import type { JSONSchema7Type } from 'json-schema';
import type { Extension, CodeRef } from '../types';

export enum UserPreferenceFieldType {
  dropdown = 'dropdown',
  checkbox = 'checkbox',
  custom = 'custom',
}

export type UserPreferenceDropdownField = {
  type: UserPreferenceFieldType.dropdown;
  userSettingsKey: string;
  defaultValue?: string;
  description?: string;
  options: {
    value: string;
    label: string;
    description?: string;
  }[];
};

export type UserPreferenceCheckboxFieldValue = string | number | boolean;

export type UserPreferenceCheckboxField = {
  type: UserPreferenceFieldType.checkbox;
  userSettingsKey: string;
  label: string;
  trueValue: UserPreferenceCheckboxFieldValue;
  falseValue: UserPreferenceCheckboxFieldValue;
  defaultValue?: UserPreferenceCheckboxFieldValue;
  description?: string;
};

export type UserPreferenceCustomField = {
  type: UserPreferenceFieldType.custom;
  component?: CodeRef<ComponentType>;
  props?: { [key: string]: JSONSchema7Type };
};

export type UserPreferenceField =
  | UserPreferenceDropdownField
  | UserPreferenceCheckboxField
  | UserPreferenceCustomField;

/** This extension can be used to add a group on the console user-preferences page.
    It will appear as a vertical tab option on the console user-preferences page. */
export type UserPreferenceGroup = Extension<
  'console.user-preference/group',
  {
    /** ID used to identify the user preference group. */
    id: string;
    /** The label of the user preference group. */
    label: string;
    /** ID of user preference group before which this group should be placed. */
    insertBefore?: string;
    /** ID of user preference group after which this group should be placed. */
    insertAfter?: string;
  }
>;

/** This extension can be used to add an item to the user preferences group on the console user preferences page. */
export type UserPreferenceItem = Extension<
  'console.user-preference/item',
  {
    /** ID used to identify the user preference item and referenced in insertAfter and insertBefore to define the item order. */
    id: string;
    /** IDs used to identify the user preference groups the item would belong to. */
    groupId: string;
    /** The label of the user preference. */
    label: string;
    /** The description of the user preference. */
    description: string;
    /** The input field options used to render the values to set the user preference. */
    field: UserPreferenceField;
    /** ID of user preference item before which this item should be placed. */
    insertBefore?: string;
    /** ID of user preference item after which this item should be placed. */
    insertAfter?: string;
  }
>;

// Type guards

export const isUserPreferenceGroup = (e: Extension): e is UserPreferenceGroup => {
  return e.type === 'console.user-preference/group';
};

export const isUserPreferenceItem = (e: Extension): e is UserPreferenceItem => {
  return e.type === 'console.user-preference/item';
};
