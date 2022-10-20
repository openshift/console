import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  CatalogExtensionHookOptions,
  CatalogItem,
  CatalogItemMetadataProviderFunction,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { IncompleteDataError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import useCatalogExtensions from '../hooks/useCatalogExtensions';
import { CatalogService } from '../utils';
import {
  keywordCompare,
  applyCatalogItemMetadata,
  useGetAllDisabledSubCatalogs,
} from '../utils/catalog-utils';
import CatalogExtensionHookResolver from './CatalogExtensionHookResolver';

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
    catalogBadgeProviderExtensions,
    extensionsResolved,
  ] = useCatalogExtensions(catalogId, catalogType);
  const { t } = useTranslation();
  const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
  const [extItemsMap, setExtItemsMap] = React.useState<{ [uid: string]: CatalogItem[] }>({});
  const [extItemsErrorMap, setItemsErrorMap] = React.useState<{ [uid: string]: Error }>({});
  const [extCatalogsErrorMap, setCatalogsErrorMap] = React.useState<{ [uid: string]: Error }>({});
  const [metadataProviderMap, setMetadataProviderMap] = React.useState<{
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
  const preCatalogItems = React.useMemo(() => {
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

  const catalogItems = React.useMemo(() => {
    if (!loaded) {
      return preCatalogItems;
    }
    return applyCatalogItemMetadata(preCatalogItems, metadataProviderMap);
  }, [loaded, preCatalogItems, metadataProviderMap]);

  const onValueResolved = React.useCallback((uid, items) => {
    setExtItemsMap((prev) => ({ ...prev, [uid]: items }));
  }, []);

  const onValueError = React.useCallback((uid, error) => {
    setItemsErrorMap((prev) => ({ ...prev, [uid]: error }));
  }, []);

  const onCatalogTypeError = React.useCallback((uid, error) => {
    setCatalogsErrorMap((prev) => ({ ...prev, [uid]: error }));
  }, []);

  const onMetadataValueResolved = React.useCallback((provider, uid, type) => {
    setMetadataProviderMap((prev) => ({
      ...prev,
      [type]: { ...(prev?.[type] ?? {}), [uid]: provider },
    }));
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
  const typesErrorMap = React.useMemo(() => {
    const errorMap = { ...extItemsErrorMap, ...extCatalogsErrorMap };
    return Object.keys(errorMap).reduce((acc, ext) => {
      if (errorMap[ext] && catalogProviderExtensions.find((e) => e.uid === ext)) {
        acc[catalogProviderExtensions.find((e) => e.uid === ext).properties.title] = errorMap[ext];
      }
      return acc;
    }, {});
  }, [extItemsErrorMap, extCatalogsErrorMap, catalogProviderExtensions]);

  const loadError = React.useMemo(() => {
    let error;
    if (!_.isEmpty(extCatalogsErrorMap)) {
      if (!loaded || failedCalls === 0 || failedCalls === totalCalls) {
        error = new IncompleteDataError(null, extCatalogsErrorMap);
      } else if (failedCalls !== totalCalls) {
        error = new IncompleteDataError(failedExtensions, extCatalogsErrorMap);
      }
    } else if (!loaded || failedCalls === 0) {
      error = null;
    } else if (loaded && failedCalls === totalCalls) {
      error = new Error(t('console-shared~Failed loading catalog data'));
    } else {
      error = new IncompleteDataError(failedExtensions);
    }
    return error;
  }, [loaded, failedCalls, extCatalogsErrorMap, totalCalls, t, failedExtensions]);

  const catalogService: CatalogService = React.useMemo(
    () => ({
      type: catalogType,
      items: catalogItems,
      itemsMap: catalogItemsMap,
      loaded,
      loadError,
      searchCatalog,
      catalogExtensions: catalogTypeExtensions,
      typesErrorMap,
    }),
    [
      catalogType,
      catalogItems,
      catalogItemsMap,
      loaded,
      loadError,
      searchCatalog,
      catalogTypeExtensions,
      typesErrorMap,
    ],
  );

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
            onCatalogTypeError={onCatalogTypeError}
          />
        ))}
      {extensionsResolved &&
        catalogBadgeProviderExtensions.map((extension) => (
          <CatalogExtensionHookResolver<CatalogItemMetadataProviderFunction>
            key={extension.uid}
            id={extension.uid}
            useValue={extension.properties.provider}
            options={defaultOptions}
            onValueResolved={(uid, value) =>
              onMetadataValueResolved(value, uid, extension.properties.type)
            }
          />
        ))}
      {children(catalogService)}
    </>
  );
};

export default CatalogServiceProvider;
