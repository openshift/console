import { UserSettingsTabGroup } from '../types';
import { getUserSettingsGroups } from '../utils/getUserSettingsGroups';
import {
  mockUserSettings,
  mockUserSettingsGroups,
  userSettingsGroupEmpty,
  userSettingsWithUnknownInput,
} from './userPreferences.data';

describe('getUserSettingsGroups', () => {
  it('should return an empty array if there are no userSettings or userSettingsGroups', () => {
    expect(getUserSettingsGroups([], [])).toHaveLength(0);
    expect(getUserSettingsGroups(mockUserSettings, [])).toHaveLength(0);
    expect(getUserSettingsGroups([], mockUserSettingsGroups)).toHaveLength(0);
  });

  it('should return user settings groups populated with their corresponding user settings', () => {
    const userSettingGroups: UserSettingsTabGroup[] = getUserSettingsGroups(
      mockUserSettings,
      mockUserSettingsGroups,
    );
    expect(userSettingGroups).toHaveLength(2);
    userSettingGroups.forEach((group) =>
      expect(group.items.every((item) => item.groupId === group.id)).toBeTruthy(),
    );
  });

  it('should create a new user settings group if a user setting does not have a groupId', () => {
    const userSettingGroups: UserSettingsTabGroup[] = getUserSettingsGroups(
      [...mockUserSettings, userSettingsWithUnknownInput],
      mockUserSettingsGroups,
    );
    expect(userSettingGroups).toHaveLength(3);
    userSettingGroups.forEach((group) =>
      expect(group.items.every((item) => (item.groupId || item.id) === group.id)).toBeTruthy(),
    );
    expect(
      userSettingGroups.find((group) => group.id === userSettingsWithUnknownInput.id),
    ).toBeDefined();
  });

  it('should not return user settings groups which have no corresponding user settings', () => {
    const userSettingGroups: UserSettingsTabGroup[] = getUserSettingsGroups(mockUserSettings, [
      ...mockUserSettingsGroups,
      userSettingsGroupEmpty,
    ]);
    expect(userSettingGroups).toHaveLength(2);
    userSettingGroups.forEach((group) =>
      expect(group.items.every((item) => item.groupId === group.id)).toBeTruthy(),
    );
    expect(
      userSettingGroups.find((group) => group.id === userSettingsGroupEmpty.id),
    ).toBeUndefined();
  });
});
