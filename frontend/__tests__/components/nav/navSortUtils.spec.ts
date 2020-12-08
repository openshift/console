import {
  getSortedNavItems,
  sortExtensionItems,
} from '@console/internal/components/nav/navSortUtils';
import { LoadedExtension, NavItem, NavSection, SeparatorNavItem } from '@console/plugin-sdk/src';

const mockNavItems: LoadedExtension<NavSection | NavItem | SeparatorNavItem>[] = [
  {
    type: 'Nav/Section',
    properties: {
      id: 'test1',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'Nav/Section',
    properties: {
      id: 'test2',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'Nav/Section',
    properties: {
      id: 'test3',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'Nav/Section',
    properties: {
      id: 'test4',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'Nav/Section',
    properties: {
      id: 'test5',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'Nav/Section',
    properties: {
      id: 'test6',
    },
    pluginID: 'test-plugin-id',
    pluginName: 'test-plugin-name',
    uid: 'test-plugin-uid',
  },
  {
    type: 'NavItem/Separator',
    properties: {
      id: 'test7',
      componentProps: {
        testID: 'test-sep',
      },
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
});
