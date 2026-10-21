import type {
  ResolvedExtension,
  UserPreferenceGroup,
  UserPreferenceItem,
} from '@console/dynamic-plugin-sdk';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';

export type ResolvedUserPreferenceGroup = UserPreferenceGroup['properties'];

export type ResolvedUserPreferenceItem = ResolvedExtension<UserPreferenceItem>['properties'];

export type UserPreferenceTabGroup = {
  id: string;
  label: string;
  items: ResolvedUserPreferenceItem[];
};

export type UserPreferenceFieldProps<T extends {}> = { id: string } & ResolvedCodeRefProperties<T>;
