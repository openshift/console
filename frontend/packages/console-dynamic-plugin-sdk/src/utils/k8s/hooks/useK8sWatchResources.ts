import { useRef, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelectorCreator, lruMemoize } from 'reselect';
import type { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import type { SDKDispatch, SDKStoreState } from '../../../app/redux-types';
import type { UseK8sWatchResources } from '../../../extensions/console-types';
import {
  transformGroupVersionKindToReference,
  getReferenceForModel,
  getGroupVersionKindForReference,
} from '../k8s-ref';
import type { GetIDAndDispatch, OpenShiftReduxRootState } from './k8s-watch-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { getK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';
import { usePrevious } from './usePrevious';

/**
 * Hook that retrieves the Kubernetes resources along with their respective status for loaded and error.
 * @param initResources resources need to be watched as key-value pair, wherein key will be unique to resource and value will be options needed to watch for the respective resource.
 * @returns A map where keys are as provided in initResouces and value has three properties data, loaded and error.
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const watchResources = {
        'deployment': {...},
        'pod': {...}
        ...
      }
 *   const {deployment, pod} = useK8sWatchResources(watchResources)
 *   return ...
 * }
 * ```
 */
export const useK8sWatchResources: UseK8sWatchResources = (initResources) => {
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<SDKStoreState>((state) => state.k8s.RESOURCES?.models) as Record<
    string,
    K8sModel
  >;

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  const k8sModelsRef = useRef<Record<string, K8sModel>>({});

  // eslint-disable-next-line react-hooks/refs -- Custom memoization: only recomputes when relevant models change, preventing unnecessary watch re-establishment
  if (
    prevResources !== resources ||
    (prevK8sModels !== allK8sModels &&
      Object.values(resources).some((r) => {
        const modelReference = transformGroupVersionKindToReference(r.groupVersionKind || r.kind);
        return (
          getK8sModel(prevK8sModels, modelReference) !== getK8sModel(allK8sModels, modelReference)
        );
      }))
  ) {
    const requiredModels = Object.values(resources).map((r) =>
      transformGroupVersionKindToReference(r.groupVersionKind || r.kind),
    );
    k8sModelsRef.current = Object.fromEntries( // eslint-disable-line react-hooks/refs
      Object.entries(allK8sModels ?? {}).filter(
        ([, model]) =>
          requiredModels.includes(getReferenceForModel(model)) ||
          requiredModels.includes(model.kind),
      ),
    );
  }

  const k8sModels = k8sModelsRef.current; // eslint-disable-line react-hooks/refs

  const reduxIDs = useMemo<{
    [key: string]: ReturnType<GetIDAndDispatch<OpenShiftReduxRootState>> & { noModel: boolean };
  }>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const modelReference = transformGroupVersionKindToReference(
              resources[key].groupVersionKind || resources[key].kind,
            );

            const resourceModel =
              modelReference &&
              (k8sModels[modelReference] ||
                k8sModels[getGroupVersionKindForReference(modelReference).kind]);
            if (!resourceModel) {
              ids[key] = {
                noModel: true,
              };
            } else {
              const idAndDispatch = getIDAndDispatch(resources[key], resourceModel);
              if (idAndDispatch) {
                ids[key] = idAndDispatch;
              }
            }
            return ids;
          }, {})
        : null,
    [k8sModels, modelsLoaded, resources],
  );

  const dispatch = useDispatch<SDKDispatch>();
  useEffect(() => {
    const reduxIDKeys = Object.keys(reduxIDs || {});
    reduxIDKeys.forEach((k) => {
      if (reduxIDs[k].dispatch) {
        dispatch(reduxIDs[k].dispatch);
      }
    });
    return () => {
      reduxIDKeys.forEach((k) => {
        if (reduxIDs[k].dispatch) {
          dispatch(k8sActions.stopK8sWatch(reduxIDs[k].id));
        }
      });
    };
  }, [dispatch, reduxIDs]);

  const resourceK8sSelectorCreator = useMemo(
    () =>
      createSelectorCreator({
        memoize: lruMemoize,
        memoizeOptions: {
          equalityCheck: (oldK8s: Record<string, any>, newK8s: Record<string, any>) =>
            Object.keys(reduxIDs || {})
              .filter((k) => !reduxIDs[k].noModel)
              .every((k) => oldK8s[reduxIDs[k].id] === newK8s[reduxIDs[k].id]),
        },
      }),
    [reduxIDs],
  );

  const resourceK8sSelector = useMemo(
    () =>
      resourceK8sSelectorCreator(
        (state: OpenShiftReduxRootState) => state.k8s,
        (k8s) => k8s,
      ),
    [resourceK8sSelectorCreator],
  );

  const resourceK8s = useSelector(resourceK8sSelector);

  const results = useMemo(
    () =>
      Object.keys(resources).reduce((acc, key) => {
        if (reduxIDs?.[key].noModel) {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: true,
            loadError: new NoModelError(),
          };
        } else if (reduxIDs?.[key].id in (resourceK8s ?? {})) {
          const data = getReduxData(resourceK8s[reduxIDs[key].id]?.data, resources[key]);
          const loaded = resourceK8s[reduxIDs[key].id]?.loaded;
          const loadError = resourceK8s[reduxIDs[key].id]?.loadError;
          acc[key] = { data, loaded, loadError };
        } else {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: false,
            loadError: undefined,
          };
        }
        return acc;
      }, {} as any),
    [resources, reduxIDs, resourceK8s],
  );
  return results;
};
