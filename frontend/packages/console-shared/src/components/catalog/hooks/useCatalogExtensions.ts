import * as React from 'react';
import * as _ from 'lodash';
import { useResolvedExtensions, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import {
  CatalogItemFilter,
  CatalogItemProvider,
  CatalogItemType,
  CatalogItemMetadataProvider,
  CatalogItemTypeMetadata,
  isCatalogItemFilter,
  isCatalogItemProvider,
  isCatalogItemType,
  isCatalogItemTypeMetadata,
  isCatalogItemMetadataProvider,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { useGetAllDisabledSubCatalogs } from '../utils';

const useCatalogExtensions = (
  catalogId: string,
  catalogType?: string,
): [
  ResolvedExtension<CatalogItemType>[],
  ResolvedExtension<CatalogItemProvider>[],
  ResolvedExtension<CatalogItemFilter>[],
  ResolvedExtension<CatalogItemMetadataProvider>[],
  boolean,
] => {
  const [disabledCatalogs] = useGetAllDisabledSubCatalogs();

  const isEnabledType = React.useCallback(
    (e: { properties: { type?: string } }) => {
      // If no type is specified, we consider it not disabled
      if (!e.properties.type) {
        return true;
      }

      return !disabledCatalogs.includes(e.properties.type);
    },
    [disabledCatalogs],
  );

  const [itemTypeExtensions, itemTypesResolved] = useResolvedExtensions<CatalogItemType>(
    React.useCallback(
      (e): e is CatalogItemType =>
        isCatalogItemType(e) &&
        isEnabledType(e) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogType, isEnabledType],
    ),
  );

  const [typeMetadataExtensions, itemTypeMetadataResolved] = useResolvedExtensions<
    CatalogItemTypeMetadata
  >(
    React.useCallback(
      (e): e is CatalogItemTypeMetadata =>
        isCatalogItemTypeMetadata(e) &&
        isEnabledType(e) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogType, isEnabledType],
    ),
  );

  const [catalogProviderExtensions, providersResolved] = useResolvedExtensions<CatalogItemProvider>(
    React.useCallback(
      (e): e is CatalogItemProvider =>
        isCatalogItemProvider(e) &&
        isEnabledType(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType, isEnabledType],
    ),
  );

  const [itemFilterExtensions, filtersResolved] = useResolvedExtensions<CatalogItemFilter>(
    React.useCallback(
      (e): e is CatalogItemFilter =>
        isCatalogItemFilter(e) &&
        isEnabledType(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType, isEnabledType],
    ),
  );

  const [metadataProviderExtensions, metadataProvidersResolved] = useResolvedExtensions<
    CatalogItemMetadataProvider
  >(
    React.useCallback(
      (e): e is CatalogItemMetadataProvider =>
        isCatalogItemMetadataProvider(e) &&
        isEnabledType(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType, isEnabledType],
    ),
  );

  const catalogTypeExtensions = React.useMemo<ResolvedExtension<CatalogItemType>[]>(
    () =>
      (catalogType
        ? itemTypeExtensions.filter((e) => e.properties.type === catalogType)
        : itemTypeExtensions
      )
        .filter(isEnabledType)
        .map((e) => {
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
    [catalogType, itemTypeExtensions, typeMetadataExtensions, isEnabledType],
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
    providersResolved &&
      filtersResolved &&
      itemTypesResolved &&
      itemTypeMetadataResolved &&
      metadataProvidersResolved,
  ];
};

export default useCatalogExtensions;
