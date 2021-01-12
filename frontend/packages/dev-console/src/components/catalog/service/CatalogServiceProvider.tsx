import * as React from 'react';
import * as _ from 'lodash';
import { CatalogExtensionHookOptions, CatalogItem } from '@console/plugin-sdk';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { keywordCompare } from '../utils/catalog-utils';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import CatalogExtensionHookResolver from './CatalogExtensionHookResolver';

export type CatalogService = {
  type: string;
  items: CatalogItem[];
  itemsMap: { [type: string]: CatalogItem[] };
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
  const [
    catalogTypeExtensions,
    catalogProviderExtensions,
    catalogFilterExtensions,
    extensionsResolved,
  ] = useCatalogExtensions(catalogType);

  const [extItemsMap, setExtItemsMap] = React.useState<{ [uid: string]: CatalogItem[] }>({});
  const [loadError, setLoadError] = React.useState();

  const loaded =
    extensionsResolved &&
    (catalogProviderExtensions.length === 0 ||
      catalogProviderExtensions.every(({ uid }) => extItemsMap[uid]));

  const catalogItems = React.useMemo(() => {
    if (!loaded) {
      return [];
    }

    const itemMap = _.flatten(
      catalogProviderExtensions.map((e) =>
        catalogFilterExtensions
          .filter((fe) => fe.properties.type === e.properties.type)
          .reduce((acc, ext) => ext.properties.filter(acc), extItemsMap[e.uid]),
      ),
    ).reduce((acc, item) => {
      acc[item.uid] = item;
      return acc;
    }, {} as { [uid: string]: CatalogItem });

    return _.sortBy(Object.values(itemMap), 'name');
  }, [extItemsMap, loaded, catalogProviderExtensions, catalogFilterExtensions]);

  const onValueResolved = React.useCallback((items, uid) => {
    setExtItemsMap((prev) => ({ ...prev, [uid]: items }));
  }, []);

  const searchCatalog = React.useCallback(
    (query: string) => {
      return catalogItems.filter((item) => keywordCompare(query, item));
    },
    [catalogItems],
  );

  const catalogItemsMap = React.useMemo(() => {
    const result: { [type: string]: CatalogItem[] } = {};
    catalogProviderExtensions.forEach((e) => {
      result[e.properties.type] = [];
    });
    catalogItems.forEach((item) => {
      result[item.type].push(item);
    });
    return result;
  }, [catalogProviderExtensions, catalogItems]);

  const catalogService = {
    type: catalogType,
    items: catalogItems,
    itemsMap: catalogItemsMap,
    loaded,
    loadError: loaded && catalogItems.length < 1 ? loadError : null,
    searchCatalog,
    catalogExtensions: catalogTypeExtensions,
  };

  return (
    <>
      {extensionsResolved &&
        catalogProviderExtensions.map((extension) => (
          <CatalogExtensionHookResolver
            key={extension.uid}
            id={extension.uid}
            useValue={extension.properties.provider}
            options={defaultOptions}
            onValueResolved={onValueResolved}
            onValueError={setLoadError}
          />
        ))}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
