import {
  ResolvedExtension,
  useResolvedExtensions,
  ResolvedCatalogItemFilter,
  ResolvedCatalogItemProvider,
  CatalogItemType,
  isCatalogItemFilter,
  isCatalogItemProvider,
  isCatalogItemType,
} from '@console/dynamic-plugin-sdk';

const useCatalogExtensions = (
  catalogType: string,
): [
  ResolvedExtension<CatalogItemType>[],
  ResolvedExtension<ResolvedCatalogItemProvider>[],
  ResolvedExtension<ResolvedCatalogItemFilter>[],
  boolean,
] => {
  const [itemTypeExtensions, typesResolved] = useResolvedExtensions<CatalogItemType>(
    isCatalogItemType,
  );
  const [itemProviderExtensions, providersResolved] = useResolvedExtensions<
    ResolvedCatalogItemProvider
  >(isCatalogItemProvider);

  const [itemFilterExtensions, filtersResolved] = useResolvedExtensions<ResolvedCatalogItemFilter>(
    isCatalogItemFilter,
  );

  const catalogTypeExtensions = catalogType
    ? itemTypeExtensions.filter((e) => e.properties.type === catalogType)
    : itemTypeExtensions;

  const catalogProviderExtensions = catalogType
    ? itemProviderExtensions.filter((e) => e.properties.type === catalogType)
    : itemProviderExtensions;

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
    typesResolved && providersResolved && filtersResolved,
  ];
};

export default useCatalogExtensions;
