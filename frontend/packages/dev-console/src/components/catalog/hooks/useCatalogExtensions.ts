import {
  CatalogItemProvider,
  CatalogItemType,
  isCatalogItemProvider,
  isCatalogItemType,
} from '@console/plugin-sdk';
import {
  ResolvedExtension,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';

const useCatalogExtensions = (
  catalogType: string,
): [ResolvedExtension<CatalogItemType>[], ResolvedExtension<CatalogItemProvider>[], boolean] => {
  const [itemTypeExtensions, typesResolved] = useResolvedExtensions<CatalogItemType>(
    isCatalogItemType,
  );
  const [itemProviderExtensions, providersResolved] = useResolvedExtensions<CatalogItemProvider>(
    isCatalogItemProvider,
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

  return [catalogTypeExtensions, catalogProviderExtensions, typesResolved && providersResolved];
};

export default useCatalogExtensions;
