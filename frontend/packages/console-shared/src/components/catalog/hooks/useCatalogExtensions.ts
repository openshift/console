import * as React from 'react';
import * as _ from 'lodash';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  CatalogItemFilter,
  CatalogItemProvider,
  CatalogItemType,
  isCatalogItemFilter,
  isCatalogItemProvider,
  isCatalogItemType,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk';

const useCatalogExtensions = (
  catalogId: string,
  catalogType?: string,
): [
  ResolvedExtension<CatalogItemType>[],
  ResolvedExtension<CatalogItemProvider>[],
  ResolvedExtension<CatalogItemFilter>[],
  boolean,
] => {
  const itemTypeExtensions = useExtensions<CatalogItemType>(isCatalogItemType);

  const [catalogProviderExtensions, providersResolved] = useResolvedExtensions<CatalogItemProvider>(
    React.useCallback(
      (e): e is CatalogItemProvider =>
        isCatalogItemProvider(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const [itemFilterExtensions, filtersResolved] = useResolvedExtensions<CatalogItemFilter>(
    React.useCallback(
      (e): e is CatalogItemFilter =>
        isCatalogItemFilter(e) &&
        _.castArray(e.properties.catalogId).includes(catalogId) &&
        (!catalogType || e.properties.type === catalogType),
      [catalogId, catalogType],
    ),
  );

  const catalogTypeExtensions = catalogType
    ? itemTypeExtensions.filter((e) => e.properties.type === catalogType)
    : itemTypeExtensions;

  catalogProviderExtensions.sort((a, b) => {
    const p1 = a.properties.priority ?? 0;
    const p2 = b.properties.priority ?? 0;
    return p1 - p2;
  });

  const catalogFilterExtensions = catalogType
    ? itemFilterExtensions.filter((e) => e.properties.type === catalogType)
    : itemFilterExtensions;

  return [
    catalogTypeExtensions,
    catalogProviderExtensions,
    catalogFilterExtensions,
    providersResolved && filtersResolved,
  ];
};

export default useCatalogExtensions;
