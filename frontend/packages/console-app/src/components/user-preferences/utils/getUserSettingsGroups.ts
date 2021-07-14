import { ResolvedUserSettings, ResolvedUserSettingsGroup, UserSettingsTabGroup } from '../types';

export const getUserSettingsGroups = (
  userSettings: ResolvedUserSettings[],
  userSettingsGroups: ResolvedUserSettingsGroup[],
): UserSettingsTabGroup[] => {
  if (!userSettings?.length || !userSettingsGroups?.length) {
    return [];
  }
  const initialUserSettingsGroup: UserSettingsTabGroup[] = userSettingsGroups.map(
    (userSettingsGroup) => ({
      ...userSettingsGroup,
      items: [],
    }),
  );
  const populatedUserSettingsGroup: UserSettingsTabGroup[] = userSettings.reduce(
    (userSettingsGroup: typeof initialUserSettingsGroup, currUserSetting) => {
      const userSettingsGroupForCurrentItem = userSettingsGroup.find(
        (a) => currUserSetting.groupId === a.id,
      );
      if (userSettingsGroupForCurrentItem) {
        userSettingsGroupForCurrentItem.items.push(currUserSetting);
      } else {
        userSettingsGroup.push({
          id: currUserSetting.id,
          label: currUserSetting.label,
          items: [currUserSetting],
        });
      }
      return userSettingsGroup;
    },
    initialUserSettingsGroup,
  );
  return populatedUserSettingsGroup.filter((group) => group.items.length);
};
