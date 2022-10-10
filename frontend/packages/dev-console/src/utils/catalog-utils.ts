import {
  useResolvedExtensions,
  CatalogItemType,
  isCatalogItemType,
} from '@console/dynamic-plugin-sdk';

enum CatalogVisibilityState {
  Enabled = 'Enabled',
  Disabled = 'Disabled',
}

export const isCatalogTypeEnabled = (catalogType: string): boolean => {
  if (window.SERVER_FLAGS.developerCatalogTypes) {
    const developerCatalogTypes = JSON.parse(window.SERVER_FLAGS.developerCatalogTypes);
    if (
      developerCatalogTypes?.state === CatalogVisibilityState.Enabled &&
      developerCatalogTypes?.enabled?.length > 0
    ) {
      return developerCatalogTypes?.enabled.includes(catalogType);
    }
    if (developerCatalogTypes?.state === CatalogVisibilityState.Disabled) {
      if (developerCatalogTypes?.disabled?.length > 0) {
        return !developerCatalogTypes?.disabled.includes(catalogType);
      }
      return false;
    }
  }
  return true;
};

export const useGetAllDisabledSubCatalogs = () => {
  const [catalogExtensionsArray] = useResolvedExtensions<CatalogItemType>(isCatalogItemType);
  const catalogTypeExtensions = catalogExtensionsArray.map((type) => {
    return type.properties.type;
  });

  if (window.SERVER_FLAGS.developerCatalogTypes) {
    const developerCatalogTypes = JSON.parse(window.SERVER_FLAGS.developerCatalogTypes);
    if (
      developerCatalogTypes?.state === CatalogVisibilityState.Enabled &&
      developerCatalogTypes?.enabled?.length > 0
    ) {
      const disabledSubCatalogs = catalogTypeExtensions.filter(
        (val) => !developerCatalogTypes?.enabled.includes(val),
      );
      return [disabledSubCatalogs, catalogTypeExtensions];
    }
    if (developerCatalogTypes?.state === CatalogVisibilityState.Disabled) {
      if (developerCatalogTypes?.disabled?.length > 0) {
        return [developerCatalogTypes?.disabled, catalogTypeExtensions];
      }
      return [catalogTypeExtensions, catalogTypeExtensions];
    }
  }
  return [[], catalogTypeExtensions];
};

export const useIsDeveloperCatalogEnabled = (): boolean => {
  const [disabledSubCatalogs, catalogExtensionsArray] = useGetAllDisabledSubCatalogs();
  if (disabledSubCatalogs.length === catalogExtensionsArray.length) {
    return (
      JSON.stringify(disabledSubCatalogs.sort()) !== JSON.stringify(catalogExtensionsArray.sort())
    );
  }
  return true;
};
