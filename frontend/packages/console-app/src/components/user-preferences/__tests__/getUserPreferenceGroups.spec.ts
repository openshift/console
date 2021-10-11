import { UserPreferenceTabGroup } from '../types';
import { getUserPreferenceGroups } from '../utils/getUserPreferenceGroups';
import {
  mockUserPreferenceItems,
  mockUserPreferenceGroups,
  userPreferenceGroupEmpty,
  userPreferenceItemWithUnknownField,
} from './userPreferences.data';

describe('getUserPreferenceGroups', () => {
  it('should return an empty array if there are no getUserPreferenceItems or getUserPreferenceGroups', () => {
    expect(getUserPreferenceGroups([], [])).toHaveLength(0);
    expect(getUserPreferenceGroups([], mockUserPreferenceItems)).toHaveLength(0);
    expect(getUserPreferenceGroups(mockUserPreferenceGroups, [])).toHaveLength(0);
  });

  it('should return user preference groups populated with their corresponding user preference items', () => {
    const userPreferenceGroups: UserPreferenceTabGroup[] = getUserPreferenceGroups(
      mockUserPreferenceGroups,
      mockUserPreferenceItems,
    );
    expect(userPreferenceGroups).toHaveLength(2);
    userPreferenceGroups.forEach((group) =>
      expect(group.items.every((item) => item.groupId === group.id)).toBeTruthy(),
    );
  });

  it('should create a new user preference group if a user preference item does not have a groupId', () => {
    const userPreferenceGroups: UserPreferenceTabGroup[] = getUserPreferenceGroups(
      mockUserPreferenceGroups,
      [...mockUserPreferenceItems, userPreferenceItemWithUnknownField],
    );
    expect(userPreferenceGroups).toHaveLength(3);
    userPreferenceGroups.forEach((group) =>
      expect(group.items.every((item) => (item.groupId || item.id) === group.id)).toBeTruthy(),
    );
    expect(
      userPreferenceGroups.find((group) => group.id === userPreferenceItemWithUnknownField.id),
    ).toBeDefined();
  });

  it('should not return user preference groups which have no corresponding user preference items', () => {
    const userPreferenceGroups: UserPreferenceTabGroup[] = getUserPreferenceGroups(
      [...mockUserPreferenceGroups, userPreferenceGroupEmpty],
      mockUserPreferenceItems,
    );
    expect(userPreferenceGroups).toHaveLength(2);
    userPreferenceGroups.forEach((group) =>
      expect(group.items.every((item) => item.groupId === group.id)).toBeTruthy(),
    );
    expect(
      userPreferenceGroups.find((group) => group.id === userPreferenceGroupEmpty.id),
    ).toBeUndefined();
  });
});
