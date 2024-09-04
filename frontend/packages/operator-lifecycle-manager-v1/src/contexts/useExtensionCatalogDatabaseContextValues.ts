import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { CLUSTER_CATALOG_GROUP_VERSION_KIND } from '../const';
import { openDatabase } from '../database/indexeddb';
import { populateExtensionCatalogDatabase } from '../database/injest';
import { ExtensionCatalogDatabaseContextValues } from './types';

export const useExtensionCatalogDatabaseContextValues: UseExtensionCatalogDatabaseContextValues = () => {
  const [catalogs] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: CLUSTER_CATALOG_GROUP_VERSION_KIND,
    isList: true,
  });
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<Error>();
  const refresh = React.useRef(
    _.debounce((newCatalogs: K8sResourceCommon[]) => {
      setDone(false);
      setError(null);
      openDatabase('olm')
        .then((database) => populateExtensionCatalogDatabase(database, newCatalogs))
        .then(() => {
          setDone(true);
          setError(null);
        })
        .catch((e) => {
          setDone(true);
          setError(e);
        });
    }, 5000),
  );

  React.useEffect(() => {
    const currentRefresh = refresh.current;
    currentRefresh(catalogs);
    return () => currentRefresh.cancel();
  }, [catalogs]);
  return { done, error };
};

export default useExtensionCatalogDatabaseContextValues;

type UseExtensionCatalogDatabaseContextValues = () => ExtensionCatalogDatabaseContextValues;
