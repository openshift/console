import { NavSection as PluginNavSection, NavItem, SeparatorNavItem } from '@console/plugin-sdk';

const itemDependsOnItem = (
  s1: PluginNavSection | NavItem | SeparatorNavItem,
  s2: PluginNavSection | NavItem | SeparatorNavItem,
) => {
  if (!s1.properties.insertBefore && !s1.properties.insertAfter) {
    return false;
  }
  const before = Array.isArray(s1.properties.insertBefore)
    ? s1.properties.insertBefore
    : [s1.properties.insertBefore];
  const after = Array.isArray(s1.properties.insertAfter)
    ? s1.properties.insertAfter
    : [s1.properties.insertAfter];
  return before.includes(s2.properties.id) || after.includes(s2.properties.id);
};

const isPositioned = (
  item: PluginNavSection | NavItem | SeparatorNavItem,
  allItems: (PluginNavSection | NavItem | SeparatorNavItem)[],
) => !!allItems.find((i) => itemDependsOnItem(item, i));

const findIndexForItem = (
  item: PluginNavSection | NavItem | SeparatorNavItem,
  currentItems: (PluginNavSection | NavItem | SeparatorNavItem)[],
) => {
  const { insertBefore, insertAfter } = item.properties;
  let index = -1;
  const before = Array.isArray(insertBefore) ? insertBefore : [insertBefore];
  const after = Array.isArray(insertAfter) ? insertAfter : [insertAfter];
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

const insertItem = (
  item: PluginNavSection | NavItem | SeparatorNavItem,
  currentItems: (PluginNavSection | NavItem | SeparatorNavItem)[],
) => {
  const index = findIndexForItem(item, currentItems);
  if (index >= 0) {
    currentItems.splice(index, 0, item);
  } else {
    currentItems.push(item);
  }
};

const insertPositionedItems = (
  insertItems: (PluginNavSection | NavItem | SeparatorNavItem)[],
  currentItems: (PluginNavSection | NavItem | SeparatorNavItem)[],
) => {
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

export const getSortedNavItems = (navItems: (PluginNavSection | NavItem | SeparatorNavItem)[]) => {
  const sortedItems = navItems.filter((item) => !isPositioned(item, navItems));
  const positionedItems = navItems.filter((item) => isPositioned(item, navItems));
  insertPositionedItems(positionedItems, sortedItems);
  return sortedItems;
};

export const sortExtensionItems = (
  extensionItems: (PluginNavSection | NavItem | SeparatorNavItem)[],
) => {
  // Mapped by item id
  const mappedIds = extensionItems.reduce((mem, i) => {
    mem[i.properties.id] = i;
    return mem;
  }, {});

  // determine all dependencies for a given id
  const dependencies = (i) => {
    const { insertBefore, insertAfter } = mappedIds[i].properties;
    const before = Array.isArray(insertBefore) ? insertBefore : [insertBefore];
    const after = Array.isArray(insertAfter) ? insertAfter : [insertAfter];
    const dependencyIds = [...before, ...after];
    return dependencyIds.reduce((acc, index) => {
      if (index) {
        // Add this dependency and its dependencies
        return [...acc, index, ...dependencies(index)];
      }
      return acc;
    }, []);
  };

  return extensionItems.sort((a, b) => dependencies(b.properties.id).indexOf(a.properties.id) * -1);
};
