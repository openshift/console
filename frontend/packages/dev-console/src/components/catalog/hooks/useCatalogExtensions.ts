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
): [ResolvedExtension<CatalogItemType>[], ResolvedExtension<CatalogItemProvider>[]] => {
  const itemTypeExtensions = useResolvedExtensions<CatalogItemType>(isCatalogItemType);
  const itemProviderExtensions = useResolvedExtensions<CatalogItemProvider>(isCatalogItemProvider);

  const catalogTypeExtensions = catalogType
    ? itemTypeExtensions.filter((e) => e.properties.type === catalogType)
    : itemTypeExtensions;

  const catalogProviderExtensions = catalogType
    ? itemProviderExtensions.filter((e) => e.properties.type === catalogType)
    : itemProviderExtensions;

  return [catalogTypeExtensions, catalogProviderExtensions];
};

export default useCatalogExtensions;
