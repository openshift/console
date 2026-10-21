import type { ReactNode, FC } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as _ from 'lodash';
import type {
  CatalogCategory,
  CatalogExtensionHookOptions,
  CatalogItem,
  CatalogItemMetadataProviderFunction,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { IncompleteDataError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import type { CatalogService } from '../utils';
import {
  keywordCompare,
  applyCatalogItemMetadata,
  useGetAllDisabledSubCatalogs,
} from '../utils/catalog-utils';
import CatalogCategoryProviderResolver from './CatalogCategoryProviderResolver';
import CatalogExtensionHookResolver from './CatalogExtensionHookResolver';

type CatalogServiceProviderProps = {
  namespace: string;
  catalogId: string;
  catalogType?: string;
  showAlreadyLoadedItemsAfter?: number;
  children: (service: CatalogService) => ReactNode;
};

/**
 * Return false until the given timeout time is up, then true.
 * Restarts the timer when the timeout changes.
 */
const useTimeout = (timeout: number) => {
  const [timeIsUp, setTimeIsUp] = useState(false);
  useEffect(() => {
    const t = timeout > 0 ? setTimeout(() => setTimeIsUp(true), timeout) : null;
    return () => clearTimeout(t);
  }, [timeout]);
  return timeIsUp;
};

const CatalogServiceProvider: FC<CatalogServiceProviderProps> = ({
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
    catalogBadgeProviderExtensions,
    categoryProviderExtensions,
    extensionsResolved,
  ] = useCatalogExtensions(catalogId, catalogType);
  const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
  const [extItemsMap, setExtItemsMap] = useState<{ [uid: string]: CatalogItem[] }>({});
  const [extItemsErrorMap, setItemsErrorMap] = useState<{ [uid: string]: Error }>({});
  const [categoryProviderMap, setCategoryProviderMap] = useState<{
    [id: string]: CatalogCategory[];
  }>({});
  const [metadataProviderMap, setMetadataProviderMap] = useState<{
    [type: string]: { [id: string]: CatalogItemMetadataProviderFunction };
  }>({});

  const showAlreadyLoadedItems = useTimeout(showAlreadyLoadedItemsAfter);

  const loaded =
    extensionsResolved &&
    (catalogProviderExtensions.length === 0 ||
      (showAlreadyLoadedItems
        ? catalogProviderExtensions.some(({ uid }) => extItemsMap[uid] || extItemsErrorMap[uid])
        : catalogProviderExtensions.every(({ uid }) => extItemsMap[uid] || extItemsErrorMap[uid])));

  const enabledCatalogProviderExtensions = catalogProviderExtensions.filter((item) => {
    return !disabledSubCatalogs?.includes(item?.properties?.type);
  });
  const preCatalogItems = useMemo(() => {
    if (!loaded) {
      return [];
    }

    const itemMap = _.flatten(
      enabledCatalogProviderExtensions.map((e) =>
        catalogFilterExtensions
          .filter((fe) => fe.properties.type === e.properties.type)
          .reduce((acc, ext) => acc.filter(ext.properties.filter), extItemsMap[e.uid] ?? []),
      ),
    ).reduce((acc, item) => {
      if (!item) return acc;
      acc[item.uid] = item;
      return acc;
    }, {} as { [uid: string]: CatalogItem });

    return _.sortBy(Object.values(itemMap), 'name');
  }, [extItemsMap, loaded, enabledCatalogProviderExtensions, catalogFilterExtensions]);

  const catalogItems = useMemo(() => {
    if (!loaded) {
      return preCatalogItems;
    }
    return applyCatalogItemMetadata(preCatalogItems, metadataProviderMap);
  }, [loaded, preCatalogItems, metadataProviderMap]);

  const onCategoryValueResolved = useCallback((newCategories, id) => {
    setCategoryProviderMap((prev) => {
      if (_.isEqual(prev[id], newCategories)) {
        return prev;
      }
      return { ...prev, [id]: newCategories };
    });
  }, []);

  const onValueResolved = useCallback((items, uid) => {
    setExtItemsMap((prev) => ({ ...prev, [uid]: items }));
  }, []);

  const onValueError = useCallback((error, uid) => {
    setItemsErrorMap((prev) => ({ ...prev, [uid]: error }));
  }, []);

  const onMetadataValueResolved = useCallback((provider, uid, type) => {
    setMetadataProviderMap((prev) => ({
      ...prev,
      [type]: { ...(prev?.[type] ?? {}), [uid]: provider },
    }));
  }, []);

  const searchCatalog = useCallback(
    (query: string) => {
      return keywordCompare(query, catalogItems);
    },
    [catalogItems],
  );

  const catalogItemsMap = useMemo(() => {
    const result: { [type: string]: CatalogItem[] } = {};
    catalogProviderExtensions.forEach((e) => {
      result[e.properties.type] = [];
    });
    catalogItems.forEach((item) => {
      if (!result[item.type]) {
        result[item.type] = [];
      }
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

  const categories = useMemo(() => _.uniqBy(_.flatten(Object.values(categoryProviderMap)), 'id'), [
    categoryProviderMap,
  ]);

  const catalogService: CatalogService = {
    type: catalogType,
    items: catalogItems,
    itemsMap: catalogItemsMap,
    loaded,
    loadError,
    searchCatalog,
    catalogExtensions: catalogTypeExtensions,
    categories,
  };

  return (
    <>
      {extensionsResolved &&
        categoryProviderExtensions.map((extension) => (
          <CatalogCategoryProviderResolver
            key={extension.uid}
            id={extension.uid}
            useValue={extension.properties.provider}
            onValueResolved={onCategoryValueResolved}
          />
        ))}
      {extensionsResolved &&
        catalogProviderExtensions.map((extension) => (
          <CatalogExtensionHookResolver<CatalogItem[]>
            key={extension.uid}
            id={extension.uid}
            useValue={extension.properties.provider}
            options={defaultOptions}
            onValueResolved={onValueResolved}
            onValueError={onValueError}
          />
        ))}
      {extensionsResolved &&
        catalogBadgeProviderExtensions.map((extension) => (
          <CatalogExtensionHookResolver<CatalogItemMetadataProviderFunction>
            key={extension.uid}
            id={extension.uid}
            useValue={extension.properties.provider}
            options={defaultOptions}
            onValueResolved={(value, uid) =>
              onMetadataValueResolved(value, uid, extension.properties.type)
            }
          />
        ))}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
