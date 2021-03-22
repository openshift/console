import {
  getSortedNavItems,
  sortExtensionItems,
} from '@console/internal/components/nav/navSortUtils';
import { LoadedExtension } from '@console/plugin-sdk/src';
import { NavItem, NavSection, Separator } from '@console/dynamic-plugin-sdk/src';

const mockNavItems: LoadedExtension<NavSection | NavItem | Separator>[] = [
  {
    type: 'console.navigation/section',
    properties: {
      id: 'test1',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'console.navigation/section',
    properties: {
      id: 'test2',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'console.navigation/section',
    properties: {
      id: 'test3',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'console.navigation/section',
    properties: {
      id: 'test4',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'console.navigation/section',
    properties: {
      id: 'test5',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'console.navigation/section',
    properties: {
      id: 'test6',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'console.navigation/separator',
    properties: {
      id: 'test7',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
];

const indexOfId = (id, sortedItems) => sortedItems.map((i) => i.properties.id).indexOf(id);

describe('perspective-nav insertPositionedItems', () => {
  it('should order items that are not positioned', () => {
    const sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id)).toEqual(
      mockNavItems.map((i) => i.properties.id),
    );
  });

  it('should order items that are positioned', () => {
    mockNavItems[0].properties.insertAfter = 'test2';
    let sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test1', sortedItems)).toBe(1);

    delete mockNavItems[0].properties.insertAfter;
    mockNavItems[0].properties.insertBefore = 'test5';
    sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test1', sortedItems)).toBe(3);

    delete mockNavItems[0].properties.insertBefore;
    mockNavItems[0].properties.insertAfter = ['x', 'y', 'test3', 'z'];
    sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test1', sortedItems)).toBe(2);

    delete mockNavItems[0].properties.insertAfter;
    mockNavItems[0].properties.insertBefore = ['x', 'y', 'test3', 'z'];
    sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test1', sortedItems)).toBe(1);

    // Before takes precedence
    mockNavItems[0].properties.insertAfter = 'test6';
    sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test1', sortedItems)).toBe(1);
  });

  it('should order items that are positioned on positioned items', () => {
    delete mockNavItems[0].properties.insertBefore;
    mockNavItems[0].properties.insertAfter = 'test6';
    mockNavItems[5].properties.insertAfter = 'test4';
    let sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test6', sortedItems)).toBe(3);
    expect(indexOfId('test1', sortedItems)).toBe(4);
    expect(indexOfId('test7', sortedItems)).toBe(6);

    mockNavItems[6].properties.insertBefore = 'test1';
    sortedItems = getSortedNavItems(mockNavItems);
    expect(indexOfId('test6', sortedItems)).toBe(3);
    expect(indexOfId('test1', sortedItems)).toBe(5);
    expect(indexOfId('test7', sortedItems)).toBe(4);
  });

  it('should sort dependency items correctly', () => {
    mockNavItems.forEach((i) => {
      delete i.properties.insertAfter;
      delete i.properties.insertBefore;
    });
    mockNavItems[0].properties.insertAfter = 'test4';
    mockNavItems[2].properties.insertAfter = 'test5';
    mockNavItems[5].properties.insertAfter = 'test7';
    mockNavItems[6].properties.insertBefore = 'test1';

    const sortedItems = sortExtensionItems(mockNavItems);
    // test1 depends on test4
    expect(indexOfId('test1', sortedItems)).toBeGreaterThan(indexOfId('test4', sortedItems));
    // test3 depends on test5
    expect(indexOfId('test3', sortedItems)).toBeGreaterThan(indexOfId('test5', sortedItems));
    // test6 depends on test7
    expect(indexOfId('test6', sortedItems)).toBeGreaterThan(indexOfId('test7', sortedItems));
    // test7 depends on test1
    expect(indexOfId('test7', sortedItems)).toBeGreaterThan(indexOfId('test1', sortedItems));
  });

  it('should handle circular dependencies fairly well', () => {
    mockNavItems.forEach((i) => {
      delete i.properties.insertAfter;
      delete i.properties.insertBefore;
    });
    mockNavItems[0].properties.insertAfter = 'test4';
    mockNavItems[2].properties.insertAfter = 'test5';
    // Circular dependency
    mockNavItems[5].properties.insertAfter = 'test7';
    mockNavItems[6].properties.insertBefore = 'test6';

    const sortedItems = sortExtensionItems(mockNavItems);
    // test1 depends on test4
    expect(indexOfId('test1', sortedItems)).toBeGreaterThan(indexOfId('test4', sortedItems));
    // test3 depends on test5
    expect(indexOfId('test3', sortedItems)).toBeGreaterThan(indexOfId('test5', sortedItems));
    // test7 depends on test1
    expect(indexOfId('test7', sortedItems)).toBeGreaterThan(indexOfId('test1', sortedItems));
  });
});
