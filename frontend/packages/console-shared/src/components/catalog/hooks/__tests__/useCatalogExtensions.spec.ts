import { renderHook } from '@testing-library/react';
import {
  CatalogItemType,
  CatalogItemTypeMetadata,
  CatalogItemProvider,
  CatalogItemFilter,
  CatalogItemMetadataProvider,
  CatalogAlert,
} from '@console/dynamic-plugin-sdk/src/extensions';
import useCatalogExtensions from '../useCatalogExtensions';

let mockExtensions: (
  | CatalogItemProvider
  | CatalogItemType
  | CatalogItemTypeMetadata
  | CatalogItemFilter
  | CatalogItemMetadataProvider
  | CatalogAlert
)[] = [];

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: (typeGuard) => [mockExtensions.filter(typeGuard), true],
}));

describe('useCatalogExtensions', () => {
  it('should return item-type extensions', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-type',
        properties: {
          type: 'type1',
          title: 'Test',
        },
      },
      {
        type: 'console.catalog/item-type',
        properties: {
          type: 'type2',
          title: 'Test2',
        },
      },
    ];
    const allExtensions = renderHook(() => useCatalogExtensions('test-catalog')).result.current[0];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);
    const extensions = renderHook(() => useCatalogExtensions('test-catalog', 'type2')).result
      .current[0];
    expect(extensions).toEqual([mockExtensions[1]]);
  });

  it('should augment types with metadata', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-type',
        properties: {
          type: 'type1',
          title: 'Test',
          filters: [
            {
              label: 'filter1-label',
              attribute: 'filter1-attribute',
            },
          ],
          groupings: [
            {
              label: 'grouping1-label',
              attribute: 'grouping1-attribute',
            },
          ],
        },
      },
      {
        type: 'console.catalog/item-type',
        properties: {
          type: 'type2',
          title: 'Test2',
          filters: [
            {
              label: 'filter2-label',
              attribute: 'filter2-attribute',
            },
          ],
          groupings: [
            {
              label: 'grouping2-label',
              attribute: 'grouping2-attribute',
            },
          ],
        },
      },

      {
        type: 'console.catalog/item-type-metadata',
        properties: {
          type: 'type2',
          filters: [
            {
              label: 'filter3-label',
              attribute: 'filter3-attribute',
            },
          ],
          groupings: [
            {
              label: 'grouping3-label',
              attribute: 'grouping3-attribute',
            },
          ],
        },
      },
    ];
    const catalogTypeExtensions = renderHook(() => useCatalogExtensions('test-catalog')).result
      .current[0];
    expect(catalogTypeExtensions).toEqual([
      mockExtensions[0],
      {
        type: 'console.catalog/item-type',
        properties: {
          type: 'type2',
          title: 'Test2',
          filters: [
            {
              label: 'filter2-label',
              attribute: 'filter2-attribute',
            },
            {
              label: 'filter3-label',
              attribute: 'filter3-attribute',
            },
          ],
          groupings: [
            {
              label: 'grouping2-label',
              attribute: 'grouping2-attribute',
            },
            {
              label: 'grouping3-label',
              attribute: 'grouping3-attribute',
            },
          ],
        },
      },
    ]);
  });

  it('should return provider extensions', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-provider',
        properties: {
          catalogId: 'test-catalog',
          type: 'type1',
          title: 'Test Provider',
          provider: jest.fn(),
        },
      },
      {
        type: 'console.catalog/item-provider',
        properties: {
          catalogId: 'test-catalog',
          type: 'type2',
          title: 'Test Provider',
          provider: jest.fn(),
        },
      },
    ];

    const allExtensions = renderHook(() => useCatalogExtensions('test-catalog')).result.current[1];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = renderHook(() => useCatalogExtensions('test-catalog', 'type2')).result
      .current[1];
    expect(extensions).toEqual([mockExtensions[1]]);
  });

  it('should return filter extensions', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-filter',
        properties: {
          catalogId: 'test-catalog',
          type: 'type1',
          filter: jest.fn(),
        },
      },
      {
        type: 'console.catalog/item-filter',
        properties: {
          catalogId: 'test-catalog',
          type: 'type2',
          filter: jest.fn(),
        },
      },
    ];

    const allExtensions = renderHook(() => useCatalogExtensions('test-catalog')).result.current[2];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = renderHook(() => useCatalogExtensions('test-catalog', 'type2')).result
      .current[2];
    expect(extensions).toEqual([mockExtensions[1]]);
  });

  it('should return metadata extensions', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-metadata',
        properties: {
          catalogId: 'test-catalog',
          type: 'type1',
          provider: jest.fn(),
        },
      },
      {
        type: 'console.catalog/item-metadata',
        properties: {
          catalogId: 'test-catalog',
          type: 'type2',
          provider: jest.fn(),
        },
      },
    ];

    const allExtensions = renderHook(() => useCatalogExtensions('test-catalog')).result.current[3];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = renderHook(() => useCatalogExtensions('test-catalog', 'type2')).result
      .current[3];
    expect(extensions).toEqual([mockExtensions[1]]);
  });

  it('should return alert extensions', () => {
    mockExtensions = [
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          component: jest.fn() as any,
        },
      },
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          type: 'type1',
          component: jest.fn() as any,
        },
      },
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          type: 'type2',
          component: jest.fn() as any,
        },
      },
    ];

    const allExtensions = testHook(() => useCatalogExtensions('test-catalog')).result.current[5];
    expect(allExtensions).toEqual([mockExtensions[0]]);

    const extensions = testHook(() => useCatalogExtensions('test-catalog', 'type2')).result
      .current[5];
    expect(extensions).toEqual([mockExtensions[0], mockExtensions[2]]);
  });

  it('should filter alert extensions by catalogId', () => {
    mockExtensions = [
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          type: 'type1',
          component: jest.fn() as any,
        },
      },
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'other-catalog',
          type: 'type1',
          component: jest.fn() as any,
        },
      },
    ];

    const extensions = testHook(() => useCatalogExtensions('test-catalog', 'type1')).result
      .current[5];
    expect(extensions).toEqual([mockExtensions[0]]);
  });

  it('should sort alert extensions by priority (higher first)', () => {
    mockExtensions = [
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          component: jest.fn() as any,
          priority: 5,
        },
      },
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          component: jest.fn() as any,
          priority: 10,
        },
      },
      {
        type: 'console.catalog/alert',
        properties: {
          catalogId: 'test-catalog',
          component: jest.fn() as any,
          priority: 1,
        },
      },
    ];

    const extensions = testHook(() => useCatalogExtensions('test-catalog')).result.current[5];
    expect(extensions[0]).toEqual(mockExtensions[1]); // priority 10
    expect(extensions[1]).toEqual(mockExtensions[0]); // priority 5
    expect(extensions[2]).toEqual(mockExtensions[2]); // priority 1
  });
});
