import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { getReduxIdPayload } from '../../../app/k8s/reducers/k8sSelector';
import { UseK8sWatchResource } from '../../../extensions/console-types';
import { getReference } from '../k8s-ref';
import { RootState } from './k8s-watch-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useModelsLoaded } from './useModelsLoaded';

export const useK8sWatchResource: UseK8sWatchResource = (initResource) => {
  const resource = useDeepCompareMemoize(initResource, true);
  const modelsLoaded = useModelsLoaded();

  const kindReference = resource?.groupVersionKind
    ? getReference(resource.groupVersionKind)
    : resource?.kind;

  const k8sModel = useSelector<RootState, K8sModel>(({ k8s }) =>
    kindReference ? k8s.getIn(['RESOURCES', 'models', kindReference]) : null,
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

  const resourceK8s = useSelector<RootState, ImmutableMap<string, any>>((state) =>
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
