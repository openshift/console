import {
  NavSection as PluginNavSection,
  NavItem as PluginNavItem,
  Separator,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';

const toArray = (val) => (val ? (Array.isArray(val) ? val : [val]) : []);

type NavItem = PluginNavSection | PluginNavItem | Separator;

const itemDependsOnItem = (s1: NavItem, s2: NavItem): boolean => {
  if (!s1.properties.insertBefore && !s1.properties.insertAfter) {
    return false;
  }
  const before = toArray(s1.properties.insertBefore);
  const after = toArray(s1.properties.insertAfter);
  return before.includes(s2.properties.id) || after.includes(s2.properties.id);
};

const isPositioned = (item: NavItem, allItems: NavItem[]): boolean =>
  !!allItems.find((i) => itemDependsOnItem(item, i));

const findIndexForItem = (item: NavItem, currentItems: NavItem[]): number => {
  const { insertBefore, insertAfter } = item.properties;
  let index = -1;
  const before = toArray(insertBefore);
  const after = toArray(insertAfter);
  let count = 0;
  while (count < before.length && index < 0) {
    index = currentItems.findIndex((i) => i.properties.id === before[count]);
    count++;
  }
  count = 0;
  while (count < after.length && index < 0) {
    index = currentItems.findIndex((i) => i.properties.id === after[count]);
    if (index >= 0) {
      index += 1;
    }
    count++;
  }
  return index;
};

const insertItem = (item: NavItem, currentItems: NavItem[]): void => {
  const index = findIndexForItem(item, currentItems);
  if (index >= 0) {
    currentItems.splice(index, 0, item);
  } else {
    currentItems.push(item);
  }
};

const insertPositionedItems = (insertItems: NavItem[], currentItems: NavItem[]): void => {
  if (insertItems.length === 0) {
    return;
  }

  const sortedItems = insertItems.filter((item) => !isPositioned(item, insertItems));
  const positionedItems = insertItems.filter((item) => isPositioned(item, insertItems));

  if (sortedItems.length === 0) {
    // Circular dependencies
    positionedItems.forEach((i) => insertItem(i, currentItems));
    return;
  }

  sortedItems.forEach((i) => insertItem(i, currentItems));
  insertPositionedItems(positionedItems, currentItems);
};

export const getSortedNavItems = (
  navItems: LoadedExtension<NavItem>[],
): LoadedExtension<NavItem>[] => {
  const sortedItems = navItems.filter((item) => !isPositioned(item, navItems));
  const positionedItems = navItems.filter((item) => isPositioned(item, navItems));
  insertPositionedItems(positionedItems, sortedItems);
  return sortedItems;
};

export const sortExtensionItems = <E extends NavItem>(
  extensionItems: LoadedExtension<E>[],
): LoadedExtension<E>[] => {
  // Mapped by item id
  const mappedIds = extensionItems.reduce((mem, i) => {
    mem[i.properties.id] = i;
    return mem;
  }, {});

  // determine all dependencies for a given id
  const dependencies = (id: string, currentDependencies: string[] = []): string[] => {
    if (currentDependencies.includes(id)) {
      return [];
    }
    const { insertBefore, insertAfter } = mappedIds[id].properties;
    const before = toArray(insertBefore);
    const after = toArray(insertAfter);
    const dependencyIds = [...before, ...after].filter(
      (i) => i !== id && !currentDependencies.includes(i),
    );
    return dependencyIds.reduce((acc, dependencyId) => {
      if (dependencyId) {
        // Add this dependency and its dependencies
        acc = [...acc, dependencyId, ...dependencies(dependencyId, [...acc, dependencyId])];
      }
      return acc;
    }, []);
  };

  const sortItems = (preSorted: NavItem[], itemsToSort: NavItem[]): NavItem[] => {
    if (itemsToSort.length < 2) {
      preSorted.push(...itemsToSort);
      return;
    }

    let sortedItem = false;
    const remainingItems = [];
    itemsToSort.forEach((item) => {
      const deps = dependencies(item.properties.id);
      // If not dependant on any items to be sorted, ok to add it in
      if (!deps.find((id) => itemsToSort.find((i) => i.properties.id === id))) {
        sortedItem = true;
        preSorted.push(item);
      } else {
        // Still has a dependency
        remainingItems.push(item);
      }
    });

    if (remainingItems.length) {
      // If nothing changed, just add the remaining items
      if (!sortedItem) {
        preSorted.push(...remainingItems);
        return;
      }
      // Sort the remaining items
      sortItems(preSorted, remainingItems);
    }
  };

  const sortedItems = [];
  sortItems(sortedItems, extensionItems);

  return sortedItems;
};
