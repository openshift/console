import {
  ResolvedUserPreferenceGroup,
  ResolvedUserPreferenceItem,
  UserPreferenceTabGroup,
} from '../types';

export const getUserPreferenceGroups = (
  userPreferenceGroups: ResolvedUserPreferenceGroup[],
  userPreferenceItems: ResolvedUserPreferenceItem[],
): UserPreferenceTabGroup[] => {
  if (!userPreferenceItems?.length || !userPreferenceGroups?.length) {
    return [];
  }
  const initialUserPreferenceGroup: UserPreferenceTabGroup[] = userPreferenceGroups.map(
    (userPreferenceGroup) => ({
      ...userPreferenceGroup,
      items: [],
    }),
  );
  const populatedUserPreferenceGroups: UserPreferenceTabGroup[] = userPreferenceItems.reduce(
    (userPreferenceGroup: typeof initialUserPreferenceGroup, currUserPreferenceItem) => {
      const userPreferenceGroupForCurrentItem = userPreferenceGroup.find(
        (group) => currUserPreferenceItem.groupId === group.id,
      );
      if (userPreferenceGroupForCurrentItem) {
        userPreferenceGroupForCurrentItem.items.push(currUserPreferenceItem);
      } else {
        userPreferenceGroup.push({
          id: currUserPreferenceItem.id,
          label: currUserPreferenceItem.label,
          items: [currUserPreferenceItem],
        });
      }
      return userPreferenceGroup;
    },
    initialUserPreferenceGroup,
  );
  return populatedUserPreferenceGroups.filter((group) => group.items.length);
};
