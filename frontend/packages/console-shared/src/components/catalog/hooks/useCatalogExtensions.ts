import { useCallback, useMemo } from 'react';
import * as _ from 'lodash';
import { useResolvedExtensions, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import {
  CatalogItemFilter,
  CatalogItemProvider,
  CatalogItemType,
  CatalogItemMetadataProvider,
  CatalogItemTypeMetadata,
  CatalogToolbarItem,
  isCatalogItemFilter,
  isCatalogItemProvider,
  isCatalogItemType,
  isCatalogItemTypeMetadata,
  isCatalogItemMetadataProvider,
  isCatalogCategoriesProvider,
  isCatalogToolbarItem,
  CatalogCategoriesProvider,
} from '@console/dynamic-plugin-sdk/src/extensions';

const useCatalogExtensions = (
  catalogId: string,
  catalogType?: string,
): [
  ResolvedExtension<CatalogItemType>[],
  ResolvedExtension<CatalogItemProvider>[],
  ResolvedExtension<CatalogItemFilter>[],
  ResolvedExtension<CatalogItemMetadataProvider>[],
  ResolvedExtension<CatalogCategoriesProvider>[],
  ResolvedExtension<CatalogToolbarItem>[],
  boolean,
] => {
  const [itemTypeExtensions, itemTypesResolved] = useResolvedExtensions<CatalogItemType>(
    useCallback(
      (e): e is CatalogItemType =>
        isCatalogItemType(e) && (!catalogType || e.properties.type === catalogType),
      [catalogType],
    ),
  );

  const [typeMetadataExtensions, itemTypeMetadataResolved] = useResolvedExtensions<
    CatalogItemTypeMetadata
  >(
    useCallback(
      (e): e is CatalogItemTypeMetadata =>
        isCatalogItemTypeMetadata(e) && (!catalogType || e.properties.type === catalogType),
      [catalogType],
    ),
  );

  const [catalogProviderExtensions, providersResolved] = useResolvedExtensions<CatalogItemProvider>(
    useCallback(
      (e): e is CatalogItemProvider =>
        isCatalogItemProvider(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const [itemFilterExtensions, filtersResolved] = useResolvedExtensions<CatalogItemFilter>(
    useCallback(
      (e): e is CatalogItemFilter =>
        isCatalogItemFilter(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const [categoryProviderExtensions, categoryProvidersResolved] = useResolvedExtensions<
    CatalogCategoriesProvider
  >(
    useCallback(
      (e): e is CatalogCategoriesProvider =>
        isCatalogCategoriesProvider(e) &&
        (!e.properties.catalogId ||
          e.properties.catalogId === catalogId ||
          !e.properties.type ||
          e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const [metadataProviderExtensions, metadataProvidersResolved] = useResolvedExtensions<
    CatalogItemMetadataProvider
  >(
    useCallback(
      (e): e is CatalogItemMetadataProvider =>
        isCatalogItemMetadataProvider(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const [toolbarItemExtensions, toolbarItemsResolved] = useResolvedExtensions<CatalogToolbarItem>(
    useCallback(
      (e): e is CatalogToolbarItem =>
        isCatalogToolbarItem(e) &&
        (!e.properties.catalogId || e.properties.catalogId === catalogId) &&
        (!e.properties.type || e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const catalogTypeExtensions = useMemo<ResolvedExtension<CatalogItemType>[]>(
    () =>
      (catalogType
        ? itemTypeExtensions.filter((e) => e.properties.type === catalogType)
        : itemTypeExtensions
      ).map((e) => {
        const metadataExts = typeMetadataExtensions.filter(
          (em) => e.properties.type === em.properties.type,
        );
        if (metadataExts.length > 0) {
          return Object.assign({}, e, {
            properties: {
              ...e.properties,
              filters: [
                ...(e.properties.filters ?? []),
                ..._.flatten(metadataExts.map((em) => em.properties.filters).filter((x) => x)),
              ],
              groupings: [
                ...(e.properties.groupings ?? []),
                ..._.flatten(metadataExts.map((em) => em.properties.groupings).filter((x) => x)),
              ],
            },
          });
        }
        return e;
      }),
    [catalogType, itemTypeExtensions, typeMetadataExtensions],
  );

  catalogProviderExtensions.sort((a, b) => {
    const p1 = a.properties.priority ?? 0;
    const p2 = b.properties.priority ?? 0;
    return p1 - p2;
  });

  const catalogFilterExtensions = catalogType
    ? itemFilterExtensions.filter((e) => e.properties.type === catalogType)
    : itemFilterExtensions;

  const catalogMetadataProviderExtensions = catalogType
    ? metadataProviderExtensions.filter((e) => e.properties.type === catalogType)
    : metadataProviderExtensions;

  return [
    catalogTypeExtensions,
    catalogProviderExtensions,
    catalogFilterExtensions,
    catalogMetadataProviderExtensions,
    categoryProviderExtensions,
    toolbarItemExtensions,
    providersResolved &&
      filtersResolved &&
      itemTypesResolved &&
      itemTypeMetadataResolved &&
      metadataProvidersResolved &&
      categoryProvidersResolved &&
      toolbarItemsResolved,
  ];
};

export default useCatalogExtensions;
