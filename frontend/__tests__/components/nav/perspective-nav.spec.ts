import { getSortedNavItems } from '@console/internal/components/nav/perspective-nav';
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
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(1);

    delete mockNavItems[0].properties.insertAfter;
    mockNavItems[0].properties.insertBefore = 'test5';
    sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(3);

    delete mockNavItems[0].properties.insertBefore;
    mockNavItems[0].properties.insertAfter = ['x', 'y', 'test3', 'z'];
    sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(2);

    delete mockNavItems[0].properties.insertAfter;
    mockNavItems[0].properties.insertBefore = ['x', 'y', 'test3', 'z'];
    sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(1);

    // Before takes precedence
    mockNavItems[0].properties.insertAfter = 'test6';
    sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(1);
  });

  it('should order items that are positioned on positioned items', () => {
    delete mockNavItems[0].properties.insertBefore;
    mockNavItems[0].properties.insertAfter = 'test6';
    mockNavItems[5].properties.insertAfter = 'test4';
    let sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test6')).toBe(3);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(4);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test7')).toBe(6);

    mockNavItems[6].properties.insertBefore = 'test1';
    sortedItems = getSortedNavItems(mockNavItems);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test6')).toBe(3);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test1')).toBe(5);
    expect(sortedItems.map((i) => i.properties.id).indexOf('test7')).toBe(4);
  });
});
