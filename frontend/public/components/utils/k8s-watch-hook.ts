import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch, Dispatch } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { useDeepCompareMemoize } from '@console/shared/src/hooks/deep-compare-memoize';
import { usePrevious } from '@console/shared/src/hooks/previous';
import {
  WatchK8sResource,
  UseK8sWatchResource,
  UseK8sWatchResources,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

import { makeQuery, makeReduxID } from './k8s-watcher';
import * as k8sActions from '../../actions/k8s';
import { K8sKind } from '../../module/k8s';
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

export const useK8sWatchResource: UseK8sWatchResource = (initResource) => {
  const resource = useDeepCompareMemoize(initResource, true);
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
    if (!resource) {
      return [undefined, true, undefined];
    }
    if (!resourceK8s) {
      const data = resource?.isList ? [] : {};
      return modelsLoaded && !k8sModel
        ? [data, true, new NoModelError()]
        : [data, false, undefined];
    }

    const data = getReduxData(resourceK8s.get('data'), resource);
    const loaded = resourceK8s.get('loaded');
    const loadError = resourceK8s.get('loadError');
    return [data, loaded, loadError];
  }, [resource, resourceK8s, modelsLoaded, k8sModel]);
};

export const useK8sWatchResources: UseK8sWatchResources = (initResources) => {
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<RootState, ImmutableMap<string, K8sKind>>((state: RootState) =>
    state.k8s.getIn(['RESOURCES', 'models']),
  );

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  const k8sModelsRef = React.useRef<ImmutableMap<string, K8sKind>>(ImmutableMap());

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
    [key: string]: ReturnType<GetIDAndDispatch> & { noModel: boolean };
  }>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const resourceModel = k8sModels.get(resources[key].kind);
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
        //specifying createSelectorCreator<ImmutableMap<string, K8sKind>> throws type error
        defaultMemoize as any,
        (oldK8s: ImmutableMap<string, K8sKind>, newK8s: ImmutableMap<string, K8sKind>) =>
          Object.keys(reduxIDs || {})
            .filter((k) => !reduxIDs[k].noModel)
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

type GetIDAndDispatch = (
  resource: WatchK8sResource,
  k8sModel: K8sKind,
) => { id: string; dispatch: (dispatch: Dispatch, getState: () => RootState) => void };
