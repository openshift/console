import {
  CatalogItemType,
  CatalogItemTypeMetadata,
  CatalogItemProvider,
  CatalogItemFilter,
  CatalogItemMetadataProvider,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import useCatalogExtensions from '../useCatalogExtensions';

let mockExtensions: (
  | CatalogItemProvider
  | CatalogItemType
  | CatalogItemTypeMetadata
  | CatalogItemFilter
  | CatalogItemMetadataProvider
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
    const allExtensions = testHook(() => useCatalogExtensions('test-catalog')).result.current[0];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);
    const extensions = testHook(() => useCatalogExtensions('test-catalog', 'type2')).result
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
    const catalogTypeExtensions = testHook(() => useCatalogExtensions('test-catalog')).result
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

    const allExtensions = testHook(() => useCatalogExtensions('test-catalog')).result.current[1];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = testHook(() => useCatalogExtensions('test-catalog', 'type2')).result
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

    const allExtensions = testHook(() => useCatalogExtensions('test-catalog')).result.current[2];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = testHook(() => useCatalogExtensions('test-catalog', 'type2')).result
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

    const allExtensions = testHook(() => useCatalogExtensions('test-catalog')).result.current[3];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = testHook(() => useCatalogExtensions('test-catalog', 'type2')).result
      .current[3];
    expect(extensions).toEqual([mockExtensions[1]]);
  });
});
