import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { getActiveCluster, SDKStoreState } from '@console/dynamic-plugin-sdk/src/app';
import { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { UseK8sWatchResources } from '../../../extensions/console-types';
import {
  transformGroupVersionKindToReference,
  getReferenceForModel,
  getGroupVersionKindForReference,
} from '../k8s-ref';
import { GetIDAndDispatch, OpenShiftReduxRootState } from './k8s-watch-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { getK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';
import { usePrevious } from './usePrevious';

/**
 * Hook that retrieves the k8s resources along with their respective status for loaded and error.
 * @param initResources resources need to be watched as key-value pair, wherein key will be unique to resource and value will be options needed to watch for the respective resource.
 * @return A map where keys are as provided in initResouces and value has three properties data, loaded and error.
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const watchResources = {
        'deployment': {...},
        'pod': {...}
        ...
      }
 *   const {deployment, pod}  = UseK8sWatchResources(watchResources)
 *   return ...
 * }
 * ```
 */
export const useK8sWatchResources: UseK8sWatchResources = (initResources) => {
  const cluster = useSelector((state: SDKStoreState) => getActiveCluster(state));
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<OpenShiftReduxRootState, ImmutableMap<string, K8sModel>>(
    (state: OpenShiftReduxRootState) => state.k8s.getIn(['RESOURCES', 'models']),
  );

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  const k8sModelsRef = React.useRef<ImmutableMap<string, K8sModel>>(ImmutableMap());

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
    k8sModelsRef.current = allK8sModels.filter(
      (model) =>
        requiredModels.includes(getReferenceForModel(model)) || requiredModels.includes(model.kind),
    );
  }

  const k8sModels = k8sModelsRef.current;

  const reduxIDs = React.useMemo<{
    [key: string]: ReturnType<GetIDAndDispatch<OpenShiftReduxRootState>> & { noModel: boolean };
  }>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const modelReference = transformGroupVersionKindToReference(
              resources[key].groupVersionKind || resources[key].kind,
            );

            const resourceModel =
              k8sModels.get(modelReference) ||
              k8sModels.get(getGroupVersionKindForReference(modelReference).kind);
            if (!resourceModel) {
              ids[key] = {
                noModel: true,
              };
            } else {
              const idAndDispatch = getIDAndDispatch(resources[key], resourceModel, cluster);
              if (idAndDispatch) {
                ids[key] = idAndDispatch;
              }
            }
            return ids;
          }, {})
        : null,
    [k8sModels, modelsLoaded, resources, cluster],
  );

  const dispatch = useDispatch();
  React.useEffect(() => {
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

  const resourceK8sSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        // specifying createSelectorCreator<ImmutableMap<string, K8sKind>> throws type error
        defaultMemoize as any,
        (oldK8s: ImmutableMap<string, K8sModel>, newK8s: ImmutableMap<string, K8sModel>) =>
          Object.keys(reduxIDs || {})
            .filter((k) => !reduxIDs[k].noModel)
            .every((k) => oldK8s.get(reduxIDs[k].id) === newK8s.get(reduxIDs[k].id)),
      ),
    [reduxIDs],
  );

  const resourceK8sSelector = React.useMemo(
    () =>
      resourceK8sSelectorCreator(
        (state: OpenShiftReduxRootState) => state.k8s,
        (k8s) => k8s,
      ),
    [resourceK8sSelectorCreator],
  );

  const resourceK8s = useSelector(resourceK8sSelector);

  const results = React.useMemo(
    () =>
      Object.keys(resources).reduce((acc, key) => {
        if (reduxIDs?.[key].noModel) {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: true,
            loadError: new NoModelError(),
          };
        } else if (resourceK8s.has(reduxIDs?.[key].id)) {
          const data = getReduxData(resourceK8s.getIn([reduxIDs[key].id, 'data']), resources[key]);
          const loaded = resourceK8s.getIn([reduxIDs[key].id, 'loaded']);
          const loadError = resourceK8s.getIn([reduxIDs[key].id, 'loadError']);
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
