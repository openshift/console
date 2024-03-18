import * as React from 'react';
import { useSelector } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import { SDKStoreState } from '../../../app';

/**
 * Wait until internal models (CRDs) are loaded.
 *
 * Note: When loading is 'in flight' (in progress) when the component
 * that uses this hook is mounted, this hook waits until this is resolved, too.
 */
export const useModelsLoaded = (): boolean => {
  const ref = React.useRef(false);
  const loaded = useSelector<SDKStoreState, K8sModel>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'loaded']),
  );
  const inFlight = useSelector<SDKStoreState, K8sModel>(({ k8s }) =>
    k8s.getIn(['RESOURCES', 'inFlight']),
  );

  if (!ref.current && loaded && !inFlight) {
    ref.current = true;
  }
  return ref.current;
};
