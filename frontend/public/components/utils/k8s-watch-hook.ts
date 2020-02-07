import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch, Dispatch } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { makeQuery, makeReduxID } from './k8s-watcher';
import * as k8sActions from '../../actions/k8s';
import { K8sResourceCommon, K8sKind, K8sResourceKindReference, Selector } from '../../module/k8s';
import { RootState } from '../../redux';
import { K8sState } from '../../reducers/k8s';

export class NoModelError extends Error {
  constructor() {
    super('Model does not exist');
  }
}

const getIDAndDispatch: GetIDAndDispatch = (resource, k8sModel) => {
  if (!k8sModel || !resource) {
    return null;
  }
  const query = makeQuery(
    resource.namespace,
    resource.selector,
    resource.fieldSelector,
    resource.name,
    resource.limit,
  );
  const id = makeReduxID(k8sModel, query);
  const dispatch = resource.isList
    ? k8sActions.watchK8sList(id, query, k8sModel)
    : k8sActions.watchK8sObject(id, resource.name, resource.namespace, query, k8sModel);
  return { id, dispatch };
};

const getReduxData = (immutableData, resource: WatchK8sResource) => {
  if (!immutableData) {
    return null;
  }
  if (resource.isList) {
    return immutableData.toArray().map((a) => a.toJSON());
  } else if (immutableData.toJSON) {
    return immutableData.toJSON();
  }
  return null;
};

const useModelsLoaded = (): boolean => {
  const ref = React.useRef(false);
  const k8sModels = useSelector<RootState, K8sKind>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'models']),
  );
  const inFlight = useSelector<RootState, K8sKind>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'inFlight']),
  );

  if (!ref.current && k8sModels.size && !inFlight) {
    ref.current = true;
  }
  return ref.current;
};

export const useK8sWatchResource = <R extends K8sResourceCommon | K8sResourceCommon[]>(
  resource: WatchK8sResource,
): WatchK8sResult<R> => {
  const modelsLoaded = useModelsLoaded();

  const k8sModel = useSelector<RootState, K8sKind>(({ k8s }) =>
    resource ? k8s.getIn(['RESOURCES', 'models', resource.kind]) : null,
  );

  const reduxID = React.useMemo(() => getIDAndDispatch(resource, k8sModel), [k8sModel, resource]);

  const dispatch = useDispatch();
  React.useEffect(() => {
    if (reduxID) {
      dispatch(reduxID.dispatch);
    }
    return () => {
      if (reduxID) {
        dispatch(k8sActions.stopK8sWatch(reduxID.id));
      }
    };
  }, [dispatch, reduxID]);

  const resourceK8s = useSelector<RootState, ImmutableMap<string, any>>(({ k8s }) =>
    reduxID ? k8s.get(reduxID.id) : null,
  );

  return React.useMemo(() => {
    if (!resourceK8s) {
      const data = resource?.isList ? [] : {};
      return modelsLoaded ? [data, true, new NoModelError()] : [data, false, undefined];
    }

    const data = getReduxData(resourceK8s.get('data'), resource);
    const loaded = resourceK8s.get('loaded');
    const loadError = resourceK8s.get('loadError');
    return [data, loaded, loadError];
  }, [modelsLoaded, resourceK8s, resource]);
};

export const useK8sWatchResources = <R extends ResourcesObject>(
  resources: WatchK8sResources<R>,
): WatchK8sResults<R> => {
  const modelsLoaded = useModelsLoaded();
  const k8sModelSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        //specifying createSelectorCreator<ImmutableMap<string, any>> throws type error
        defaultMemoize as any,
        (oldModels: ImmutableMap<string, any>, newModels: ImmutableMap<string, any>) =>
          Object.values(resources).every(({ kind }) => oldModels.get(kind) === newModels.get(kind)),
      ),
    [resources],
  );

  const k8sModelSelector = React.useMemo(
    () =>
      k8sModelSelectorCreator(
        (state: RootState) => state.k8s.getIn(['RESOURCES', 'models']),
        (models) => {
          const requiredModels = Object.values(resources).map((r) => r.kind);
          return models.filter((model, key) => requiredModels.includes(key));
        },
      ),
    [k8sModelSelectorCreator, resources],
  );

  const k8sModels = useSelector<RootState, ImmutableMap<string, any>>(k8sModelSelector);
  const hasAllModelsLoaded = React.useMemo(() => modelsLoaded || k8sModels.every((m) => !!m), [
    k8sModels,
    modelsLoaded,
  ]);

  const reduxIDs = React.useMemo(
    () =>
      hasAllModelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const idAndDispatch = getIDAndDispatch(
              resources[key],
              k8sModels.get(resources[key].kind),
            );
            if (idAndDispatch) {
              ids[key] = idAndDispatch;
            }
            return ids;
          }, {})
        : {},
    [resources, k8sModels, hasAllModelsLoaded],
  );

  const dispatch = useDispatch();
  React.useEffect(() => {
    Object.keys(reduxIDs)
      .filter((k) => !!reduxIDs[k])
      .forEach((k) => dispatch(reduxIDs[k].dispatch));
    return () => {
      Object.keys(reduxIDs)
        .filter((k) => !!reduxIDs[k])
        .forEach((k) => dispatch(k8sActions.stopK8sWatch(reduxIDs[k].id)));
    };
  }, [dispatch, reduxIDs]);

  const resourceK8sSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        //specifying createSelectorCreator<ImmutableMap<string, K8sKind>> throws type error
        defaultMemoize as any,
        (oldK8s: ImmutableMap<string, K8sKind>, newK8s: ImmutableMap<string, K8sKind>) =>
          Object.keys(reduxIDs)
            .filter((id) => !!id)
            .every((k) => oldK8s.get(reduxIDs[k].id) === newK8s.get(reduxIDs[k].id)),
      ),
    [reduxIDs],
  );

  const resourceK8sSelector = React.useMemo(
    () =>
      resourceK8sSelectorCreator(
        (state: RootState) => state.k8s,
        (k8s) => k8s,
      ),
    [resourceK8sSelectorCreator],
  );

  const resourceK8s = useSelector<RootState, K8sState>(resourceK8sSelector);
  const noModels = modelsLoaded && !Object.keys(reduxIDs).length;

  const results = React.useMemo<WatchK8sResults<R>>(() => {
    if (Object.keys(reduxIDs).length) {
      return Object.keys(resources).reduce((acc, key) => {
        if (reduxIDs[key] && resourceK8s.has(reduxIDs[key].id)) {
          const data = getReduxData(resourceK8s.getIn([reduxIDs[key].id, 'data']), resources[key]);
          const loaded = resourceK8s.getIn([reduxIDs[key].id, 'loaded']);
          const loadError = resourceK8s.getIn([reduxIDs[key].id, 'loadError']);
          acc[key] = { data, loaded, loadError };
        } else {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: true,
            loadError: new NoModelError(),
          };
        }
        return acc;
      }, {} as any);
    }
    return Object.keys(resources).reduce((acc, key) => {
      const data = resources[key].isList ? [] : {};
      acc[key] = noModels
        ? { data, loaded: true, loadError: new NoModelError() }
        : { data, loaded: false, loadError: undefined };
      return acc;
    }, {});
  }, [reduxIDs, resources, resourceK8s, noModels]);

  return results;
};

type GetIDAndDispatch = (
  resource: WatchK8sResource,
  k8sModel: K8sKind,
) => { id: string; dispatch: (dispatch: Dispatch, getState: () => RootState) => void };

type ResourcesObject = { [key: string]: K8sResourceCommon | K8sResourceCommon[] };

type WatchK8sResult<R extends K8sResourceCommon | K8sResourceCommon[]> = [R, boolean, any];

type WatchK8sResults<R extends ResourcesObject> = {
  [k in keyof R]: { data: R[k]; loaded: boolean; loadError: any };
};

export type WatchK8sResources<R extends ResourcesObject> = {
  [k in keyof R]: WatchK8sResource;
};

export type WatchK8sResource = {
  kind: K8sResourceKindReference;
  name?: string;
  namespace?: string;
  isList?: boolean;
  selector?: Selector;
  namespaced?: boolean;
  limit?: number;
  fieldSelector?: string;
  optional?: boolean;
};
