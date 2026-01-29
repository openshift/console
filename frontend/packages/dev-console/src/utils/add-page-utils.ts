import type { SyntheticEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom-v5-compat';
import type { AddAction, AddActionGroup, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import type { AddGroup } from '../components/types';

export const getAddGroups = (
  addActions: ResolvedExtension<AddAction>[],
  addActionGroups: AddActionGroup['properties'][],
): AddGroup[] => {
  if (!addActions || !addActionGroups) {
    return [];
  }
  const initialActionGroups: AddGroup[] = addActionGroups.map((actionGroup) => ({
    ...actionGroup,
    items: [],
  }));
  const populatedActionGroups = addActions.reduce(
    (actionGroups: typeof initialActionGroups, currAction) => {
      const actionGroupsForCurrentItem = actionGroups.filter(
        (a) => currAction.properties.groupId === a.id,
      );
      if (actionGroupsForCurrentItem.length) {
        actionGroupsForCurrentItem.forEach((group) => group.items.push(currAction));
      } else {
        actionGroups.push({
          id: currAction.properties.id,
          name: currAction.properties.label,
          items: [currAction],
        });
      }
      return actionGroups;
    },
    initialActionGroups,
  );
  return populatedActionGroups.filter((group) => group.items.length);
};

export const navigateTo = (e: SyntheticEvent, url: string, navigate: NavigateFunction) => {
  navigate(url);
  e.preventDefault();
};

export const resolvedHref = (href: string, namespace: string): string | null =>
  href && namespace ? href.replace(/:namespace\b/g, namespace) : null;

export const filterNamespaceScopedUrl = (
  namespace: string,
  addActions: ResolvedExtension<AddAction>[],
): ResolvedExtension<AddAction>[] => {
  if (!namespace || !addActions) {
    return [];
  }
  if (namespace === ALL_NAMESPACES_KEY) {
    return addActions.filter(({ properties: { href } }) => !href?.match(/:namespace\b/));
  }
  return addActions;
};
