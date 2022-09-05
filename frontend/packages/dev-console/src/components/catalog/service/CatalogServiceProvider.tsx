import * as React from 'react';
import * as _ from 'lodash';
import {
  ResolvedExtension,
  CatalogExtensionHookOptions,
  CatalogItem,
  CatalogItemType,
} from '@console/dynamic-plugin-sdk';
import { IncompleteDataError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import { keywordCompare } from '../utils/catalog-utils';
import CatalogExtensionHookResolver from './CatalogExtensionHookResolver';

export type CatalogService = {
  type: string;
  items: CatalogItem[];
  itemsMap: { [type: string]: CatalogItem[] };
  loaded: boolean;
  loadError: any;
  searchCatalog: (query: string) => CatalogItem[];
  catalogExtensions: ResolvedExtension<CatalogItemType>[];
};

type CatalogServiceProviderProps = {
  namespace: string;
  catalogId: string;
  catalogType?: string;
  showAlreadyLoadedItemsAfter?: number;
  children: (service: CatalogService) => React.ReactNode;
};

/**
 * Return false until the given timeout time is up, then true.
 * Restarts the timer when the timeout changes.
 */
const useTimeout = (timeout: number) => {
  const [timeIsUp, setTimeIsUp] = React.useState(false);
  React.useEffect(() => {
    const t = timeout > 0 ? setTimeout(() => setTimeIsUp(true), timeout) : null;
    return () => clearTimeout(t);
  }, [timeout]);
  return timeIsUp;
};

const CatalogServiceProvider: React.FC<CatalogServiceProviderProps> = ({
  namespace,
  catalogId,
  catalogType,
  showAlreadyLoadedItemsAfter = 3000,
  children,
}) => {
  const defaultOptions: CatalogExtensionHookOptions = { namespace };
  const [
    catalogTypeExtensions,
    catalogProviderExtensions,
    catalogFilterExtensions,
    extensionsResolved,
  ] = useCatalogExtensions(catalogId, catalogType);

  const [extItemsMap, setExtItemsMap] = React.useState<{ [uid: string]: CatalogItem[] }>({});
  const [extItemsErrorMap, setItemsErrorMap] = React.useState<{ [uid: string]: Error }>({});

  const showAlreadyLoadedItems = useTimeout(showAlreadyLoadedItemsAfter);

  const loaded =
    extensionsResolved &&
    (catalogProviderExtensions.length === 0 ||
      (showAlreadyLoadedItems
        ? catalogProviderExtensions.some(({ uid }) => extItemsMap[uid] || extItemsErrorMap[uid])
        : catalogProviderExtensions.every(({ uid }) => extItemsMap[uid] || extItemsErrorMap[uid])));

  const catalogItems = React.useMemo(() => {
    if (!loaded) {
      return [];
    }

    const itemMap = _.flatten(
      catalogProviderExtensions.map((e) =>
        catalogFilterExtensions
          .filter((fe) => fe.properties.type === e.properties.type)
          .reduce((acc, ext) => acc.filter(ext.properties.filter), extItemsMap[e.uid]),
      ),
    ).reduce((acc, item) => {
      if (!item) return acc;

      acc[item.uid] = item;
      return acc;
    }, {} as { [uid: string]: CatalogItem });

    return _.sortBy(Object.values(itemMap), 'name');
  }, [extItemsMap, loaded, catalogProviderExtensions, catalogFilterExtensions]);

  const onValueResolved = React.useCallback((items, uid) => {
    setExtItemsMap((prev) => ({ ...prev, [uid]: items }));
  }, []);

  const onValueError = React.useCallback((error, uid) => {
    setItemsErrorMap((prev) => ({ ...prev, [uid]: error }));
  }, []);

  const searchCatalog = React.useCallback(
    (query: string) => {
      return keywordCompare(query, catalogItems);
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

  const failedExtensions = [
    ...new Set(
      catalogProviderExtensions
        .filter(({ uid }) => extItemsErrorMap[uid])
        .map((e) => e.properties.title),
    ),
  ];

  const failedCalls = catalogProviderExtensions.filter(({ uid }) => extItemsErrorMap[uid]).length;
  const totalCalls = catalogProviderExtensions.length;
  const loadError =
    !loaded || failedCalls === 0
      ? null
      : failedCalls === totalCalls
      ? new Error('failed loading catalog data')
      : new IncompleteDataError(failedExtensions);

  const catalogService: CatalogService = {
    type: catalogType,
    items: catalogItems,
    itemsMap: catalogItemsMap,
    loaded,
    loadError,
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
            onValueError={onValueError}
          />
        ))}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
