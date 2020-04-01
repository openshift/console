import { ConfigMapKind, k8sGet } from '@console/internal/module/k8s';
import * as React from 'react';
import {
  STORAGE_CLASS_CONFIG_MAP_NAME,
  STORAGE_CLASS_CONFIG_MAP_NAMESPACES,
} from '../constants/sc';
import { ConfigMapModel } from '@console/internal/models';
import { joinGrammaticallyListOfItems } from '@console/shared/src';
import { FirehoseResult } from '@console/internal/components/utils';

type UseConfigMapResult = [ConfigMapKind, boolean, string];

export const useStorageClassConfigMap = (): UseConfigMapResult => {
  const [storageClassConfigMap, setStorageClassConfigMap] = React.useState<ConfigMapKind>(
    undefined,
  );
  const [error, setError] = React.useState<string>(undefined);

  React.useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      for (const namespace of STORAGE_CLASS_CONFIG_MAP_NAMESPACES) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const configMap = await k8sGet(ConfigMapModel, STORAGE_CLASS_CONFIG_MAP_NAME, namespace, {
            signal: controller.signal,
          });
          if (configMap && !controller.signal.aborted) {
            setStorageClassConfigMap(configMap);
            return;
          }
        } catch (e) {
          if (controller.signal.aborted) {
            return;
          }
        }
      }

      if (!controller.signal.aborted) {
        setStorageClassConfigMap(null);
        const err = `Could not load storage class config map in following namespaces: ${joinGrammaticallyListOfItems(
          STORAGE_CLASS_CONFIG_MAP_NAMESPACES,
          'or',
        )}`;
        setError(err);
        // eslint-disable-next-line no-console
        console.warn(err);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const isLoaded = storageClassConfigMap !== undefined;

  return React.useMemo<UseConfigMapResult>(() => [storageClassConfigMap, isLoaded, error], [
    storageClassConfigMap,
    isLoaded,
    error,
  ]);
};

export const useStorageClassConfigMapWrapped = (): FirehoseResult<ConfigMapKind> => {
  const [data, loaded, loadError] = useStorageClassConfigMap();
  return React.useMemo<FirehoseResult<ConfigMapKind>>(
    () => ({
      loaded,
      loadError,
      data,
    }),
    [data, loaded, loadError],
  );
};
