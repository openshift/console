import * as React from 'react';
import * as _ from 'lodash';
import { CatalogExtensionHookOptions, CatalogItem } from '@console/plugin-sdk';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { keywordCompare } from '../utils/utils';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import CatalogItemsLoader from './CatalogItemsLoader';

export type CatalogService = {
  type: string;
  items: CatalogItem[];
  itemsMap: { [key: string]: CatalogItem[] };
  loaded: boolean;
  loadError: any;
  searchCatalog: (query: string) => CatalogItem[];
  catalogExtensions: ResolvedExtension<any>;
};

type CatalogServiceProviderProps = {
  namespace: string;
  catalogType?: string;
  children: (service: CatalogService) => React.ReactNode;
};

const CatalogServiceProvider: React.FC<CatalogServiceProviderProps> = ({
  catalogType,
  children,
  namespace,
}) => {
  const defaultOptions: CatalogExtensionHookOptions = { namespace };
  const [catalogTypeExtensions, catalogProviderExtensions] = useCatalogExtensions(catalogType);

  const [catalogItemsMap, setCatalogItemsMap] = React.useState<{ [key: string]: CatalogItem[] }>(
    {},
  );
  const [loadError, setLoadError] = React.useState();

  const loaded =
    catalogTypeExtensions.length === 0 ||
    catalogTypeExtensions.every(({ properties: { type } }) => catalogItemsMap[type]);

  const catalogItems = React.useMemo(
    () => (loaded ? _.flatten(Object.values(catalogItemsMap)) : []),
    [catalogItemsMap, loaded],
  );

  const handleItemsLoaded = React.useCallback((items, type) => {
    setCatalogItemsMap((prev) => ({ ...prev, [type]: items }));
  }, []);

  const searchCatalog = React.useCallback(
    (query: string) => {
      return catalogItems.filter((item) => keywordCompare(query, item));
    },
    [catalogItems],
  );

  const catalogService = {
    type: catalogType,
    items: catalogItems,
    itemsMap: catalogItemsMap,
    loaded: catalogTypeExtensions.length === 0 ? true : catalogItems.length > 0,
    loadError,
    searchCatalog,
    catalogExtensions: catalogTypeExtensions,
  };

  return (
    <>
      {catalogTypeExtensions.map((typeExtension) => {
        const providers = catalogProviderExtensions.filter(
          (providerExtension) =>
            typeExtension.properties.type === providerExtension.properties.type,
        );
        return (
          <CatalogItemsLoader
            key={typeExtension.properties.type}
            catalogType={typeExtension.properties.type}
            providerExtensions={providers}
            onItemsLoaded={handleItemsLoaded}
            onLoadError={setLoadError}
            options={defaultOptions}
          />
        );
      })}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
