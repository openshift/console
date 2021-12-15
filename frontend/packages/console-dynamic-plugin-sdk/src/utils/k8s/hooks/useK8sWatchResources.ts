import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { UseK8sWatchResources } from '../../../extensions/console-types';
import { getReference } from '../k8s-ref';
import { GetIDAndDispatch, OpenShiftReduxRootState } from './k8s-watch-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useModelsLoaded } from './useModelsLoaded';
import { usePrevious } from './usePrevious';

export const useK8sWatchResources: UseK8sWatchResources = (initResources) => {
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<OpenShiftReduxRootState, ImmutableMap<string, K8sModel>>(
    (state: OpenShiftReduxRootState) => state.sdkK8s.getIn(['RESOURCES', 'models']),
  );

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  const k8sModelsRef = React.useRef<ImmutableMap<string, K8sModel>>(ImmutableMap());

  if (
    prevResources !== resources ||
    (prevK8sModels !== allK8sModels &&
      Object.values(resources).some(
        ({ kind }) => prevK8sModels?.get(kind) !== allK8sModels.get(kind),
      ))
  ) {
    const requiredModels = Object.values(resources).map((r) => r.kind);
    k8sModelsRef.current = allK8sModels.filter((model, key) => requiredModels.includes(key));
  }

  const k8sModels = k8sModelsRef.current;

  const reduxIDs = React.useMemo<{
    [key: string]: ReturnType<GetIDAndDispatch<OpenShiftReduxRootState>> & { noModel: boolean };
  }>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const kindReference = resources[key]?.groupVersionKind
              ? getReference(resources[key].groupVersionKind)
              : resources[key].kind;

            const resourceModel = k8sModels.get(kindReference);
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
        (state: OpenShiftReduxRootState) => state.sdkK8s,
        (sdkK8s) => sdkK8s,
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
