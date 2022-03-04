import * as React from 'react';
import * as _ from 'lodash';
import {
  CatalogExtensionHookOptions,
  CatalogItem,
  CatalogItemMetadataProviderFunction,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { IncompleteDataError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import { CatalogService } from '../utils';
import { keywordCompare, applyCatalogItemMetadata } from '../utils/catalog-utils';
import CatalogExtensionHookResolver from './CatalogExtensionHookResolver';

type CatalogServiceProviderProps = {
  namespace: string;
  catalogId: string;
  catalogType?: string;
  children: (service: CatalogService) => React.ReactNode;
};

const CatalogServiceProvider: React.FC<CatalogServiceProviderProps> = ({
  catalogId,
  catalogType,
  children,
  namespace,
}) => {
  const defaultOptions: CatalogExtensionHookOptions = { namespace };
  const [
    catalogTypeExtensions,
    catalogProviderExtensions,
    catalogFilterExtensions,
    catalogBadgeProviderExtensions,
    extensionsResolved,
  ] = useCatalogExtensions(catalogId, catalogType);

  const [extItemsMap, setExtItemsMap] = React.useState<{ [uid: string]: CatalogItem[] }>({});
  const [extItemsErrorMap, setItemsErrorMap] = React.useState<{ [uid: string]: Error }>({});
  const [metadataProviderMap, setMetadataProviderMap] = React.useState<{
    [type: string]: CatalogItemMetadataProviderFunction[];
  }>({});

  const loaded =
    extensionsResolved &&
    (catalogProviderExtensions.length === 0 ||
      catalogProviderExtensions.every(({ uid }) => extItemsMap[uid] || extItemsErrorMap[uid]));

  const preCatalogItems = React.useMemo(() => {
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

  const catalogItems = React.useMemo(() => {
    if (!loaded) {
      return preCatalogItems;
    }
    return applyCatalogItemMetadata(preCatalogItems, metadataProviderMap);
  }, [loaded, preCatalogItems, metadataProviderMap]);

  const onValueResolved = React.useCallback((items, uid) => {
    setExtItemsMap((prev) => ({ ...prev, [uid]: items }));
  }, []);

  const onValueError = React.useCallback((error, uid) => {
    setItemsErrorMap((prev) => ({ ...prev, [uid]: error }));
  }, []);

  const onMetadataValueResolved = React.useCallback((provider, type) => {
    setMetadataProviderMap((prev) => ({ ...prev, [type]: [...(prev?.[type] ?? []), provider] }));
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
            onValueResolved={(value) => onMetadataValueResolved(value, extension.properties.type)}
          />
        ))}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
