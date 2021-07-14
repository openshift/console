import {
  DropdownOption as DropdownType,
  ResolvedExtension,
  UserSettings,
  UserSettingsGroup,
} from '@console/dynamic-plugin-sdk';

export type DropdownOption = DropdownType['options'][number];

export type ResolvedUserSettings = ResolvedExtension<UserSettings>['properties'];
export type ResolvedUserSettingsGroup = UserSettingsGroup['properties'];

export type UserSettingsTabGroup = {
  id: string;
  label: string;
  items: ResolvedUserSettings[];
};
