import type {
  CatalogItemType,
  CatalogItemTypeMetadata,
  CatalogItemProvider,
  CatalogItemFilter,
  CatalogItemMetadataProvider,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useCatalogExtensions } from '../useCatalogExtensions';

let mockExtensions: (
  | CatalogItemProvider
  | CatalogItemType
  | CatalogItemTypeMetadata
  | CatalogItemFilter
  | CatalogItemMetadataProvider
)[] = [];

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: (predicate) => [mockExtensions.filter(predicate), true],
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
    const allExtensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog')).result
      .current[0];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);
    const extensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog', 'type2'))
      .result.current[0];
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
    const catalogTypeExtensions = renderHookWithProviders(() =>
      useCatalogExtensions('test-catalog'),
    ).result.current[0];
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

    const allExtensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog')).result
      .current[1];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog', 'type2'))
      .result.current[1];
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

    const allExtensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog')).result
      .current[2];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog', 'type2'))
      .result.current[2];
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

    const allExtensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog')).result
      .current[3];
    expect(allExtensions).toEqual([mockExtensions[0], mockExtensions[1]]);

    const extensions = renderHookWithProviders(() => useCatalogExtensions('test-catalog', 'type2'))
      .result.current[3];
    expect(extensions).toEqual([mockExtensions[1]]);
  });
});

// Shared operator filters and generation filters are contributed through item-type metadata.
describe('useCatalogExtensions item type metadata merging', () => {
  it('should merge filters from a matching item-type-metadata into a filterless type', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-type',
        properties: { type: 'operator', title: 'Operators' },
      },
      {
        type: 'console.catalog/item-type-metadata',
        properties: {
          type: 'operator',
          filters: [{ label: 'Source', attribute: 'source' }],
        },
      },
      {
        type: 'console.catalog/item-type-metadata',
        properties: {
          type: 'operator',
          filters: [{ label: 'Catalog', attribute: 'operatorCatalog', filterType: 'radio' }],
        },
      },
    ];
    const { result } = renderHookWithProviders(() =>
      useCatalogExtensions('dev-catalog', 'operator'),
    );

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].properties.filters).toEqual([
      { label: 'Source', attribute: 'source' },
      { label: 'Catalog', attribute: 'operatorCatalog', filterType: 'radio' },
    ]);
  });

  it('should not merge metadata filters into a different type', () => {
    mockExtensions = [
      {
        type: 'console.catalog/item-type',
        properties: { type: 'HelmChart', title: 'Helm Charts' },
      },
      {
        type: 'console.catalog/item-type-metadata',
        properties: {
          type: 'operator',
          filters: [{ label: 'Source', attribute: 'source' }],
        },
      },
    ];
    const { result } = renderHookWithProviders(() =>
      useCatalogExtensions('dev-catalog', 'HelmChart'),
    );

    expect(result.current[0][0].properties.filters).toBeUndefined();
  });
});
