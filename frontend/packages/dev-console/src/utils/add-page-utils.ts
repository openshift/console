import { AddAction, AddActionGroup, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import { LoadedExtension } from '@console/plugin-sdk/src';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { AddGroup } from '../components/types';

export const getAddGroups = (
  addActions: ResolvedExtension<AddAction>[],
  addActionGroups: LoadedExtension<AddActionGroup>[],
): AddGroup[] => {
  if (!addActions || !addActionGroups) {
    return [];
  }
  const initialActionGroups: AddGroup[] = addActionGroups.map((actionGroup) => ({
    ...actionGroup.properties,
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

export const navigateTo = (e: React.SyntheticEvent, url: string) => {
  history.push(url);
  e.preventDefault();
};

export const resolvedHref = (href: string, namespace: string): string =>
  href && namespace ? href.replace(/:namespace\b/g, namespace) : null;

export const filterNamespaceScopedUrl = (
  namespace: string,
  addActions: ResolvedExtension<AddAction>[],
): ResolvedExtension<AddAction>[] => {
  if (!namespace || !addActions) {
    return [];
  }
  if (namespace === ALL_NAMESPACES_KEY) {
    return addActions.filter(({ properties: { href } }) => !href.match(/:namespace\b/));
  }
  return addActions;
};

interface ItemsToSort {
  properties: {
    id: string;
    insertBefore?: string;
    insertAfter?: string;
  };
}

const toArray = (val) => (val ? (Array.isArray(val) ? val : [val]) : []);

const itemDependsOnItem = <T extends ItemsToSort>(s1: T, s2: T): boolean => {
  if (!s1.properties.insertBefore && !s1.properties.insertAfter) {
    return false;
  }
  const before = toArray(s1.properties.insertBefore);
  const after = toArray(s1.properties.insertAfter);
  return before.includes(s2.properties.id) || after.includes(s2.properties.id);
};

const isPositioned = <T extends ItemsToSort>(item: T, allItems: T[]): boolean =>
  !!allItems.find((i) => itemDependsOnItem<T>(item, i));

const findIndexForItem = <T extends ItemsToSort>(item: T, currentItems: T[]): number => {
  const { insertBefore, insertAfter } = item.properties;
  let index = -1;
  const before = toArray(insertBefore);
  const after = toArray(insertAfter);
  let count = 0;
  while (count < before.length && index < 0) {
    // eslint-disable-next-line no-loop-func
    index = currentItems.findIndex((i) => i.properties.id === before[count]);
    count++;
  }
  count = 0;
  while (count < after.length && index < 0) {
    // eslint-disable-next-line no-loop-func
    index = currentItems.findIndex((i) => i.properties.id === after[count]);
    if (index >= 0) {
      index += 1;
    }
    count++;
  }
  return index;
};

const insertItem = <T extends ItemsToSort>(item: T, currentItems: T[]): void => {
  const index = findIndexForItem<T>(item, currentItems);
  if (index >= 0) {
    currentItems.splice(index, 0, item);
  } else {
    currentItems.push(item);
  }
};

const insertPositionedItems = <T extends ItemsToSort>(
  insertItems: T[],
  currentItems: T[],
): void => {
  if (insertItems.length === 0) {
    return;
  }

  const sortedItems = insertItems.filter((item) => !isPositioned<T>(item, insertItems));
  const positionedItems = insertItems.filter((item) => isPositioned<T>(item, insertItems));

  if (sortedItems.length === 0) {
    // Circular dependencies
    positionedItems.forEach((i) => insertItem<T>(i, currentItems));
    return;
  }

  sortedItems.forEach((i) => insertItem<T>(i, currentItems));
  insertPositionedItems<T>(positionedItems, currentItems);
};

export const getSortedExtensionItems = <T extends ItemsToSort>(items: T[]): T[] => {
  if (!items || !items.length) {
    return [];
  }
  const sortedItems = items.filter((item) => !isPositioned<T>(item, items));
  const positionedItems = items.filter((item) => isPositioned<T>(item, items));
  insertPositionedItems<T>(positionedItems, sortedItems);
  return sortedItems;
};
