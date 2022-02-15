import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import { getActiveCluster } from '../../../app/core/reducers/coreSelectors';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { getReduxIdPayload } from '../../../app/k8s/reducers/k8sSelector';
import { SDKStoreState } from '../../../app/redux-types';
import { UseK8sWatchResource } from '../../../extensions/console-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';

/**
 * Hook that retrieves the k8s resource along with status for loaded and error.
 * @param initResource options needed to watch for resource.
 * @return An array with first item as resource(s), second item as loaded status and third item as error state if any.
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const watchRes = {
        ...
      }
 *   const [data, loaded, error] = UseK8sWatchResource(watchRes)
 *   return ...
 * }
 * ```
 */
export const useK8sWatchResource: UseK8sWatchResource = (initResource) => {
  const cluster = useSelector((state) => getActiveCluster(state));
  const resource = useDeepCompareMemoize(initResource, true);
  const modelsLoaded = useModelsLoaded();

  const [k8sModel] = useK8sModel(resource?.groupVersionKind || resource?.kind);

  const reduxID = React.useMemo(() => getIDAndDispatch(resource, k8sModel, cluster), [
    k8sModel,
    resource,
    cluster,
  ]);

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

  const resourceK8s = useSelector<SDKStoreState, ImmutableMap<string, any>>((state) =>
    reduxID ? getReduxIdPayload(state, reduxID.id) : null,
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
