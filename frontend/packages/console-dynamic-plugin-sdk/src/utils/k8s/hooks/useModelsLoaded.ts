import { useRef } from 'react';
import { useSelector } from 'react-redux';
import type { OpenShiftReduxRootState } from './k8s-watch-types';

/**
 * Wait until internal models (CRDs) are loaded.
 *
 * Note: When loading is 'in flight' (in progress) when the component
 * that uses this hook is mounted, this hook waits until this is resolved, too.
 */
export const useModelsLoaded = (): boolean => {
  const ref = useRef(false);
  const loaded = useSelector<OpenShiftReduxRootState, boolean>(({ k8s }) => k8s.RESOURCES?.loaded);
  const inFlight = useSelector<OpenShiftReduxRootState, boolean>(
    ({ k8s }) => k8s.RESOURCES?.inFlight,
  );

  // eslint-disable-next-line react-hooks-js/refs -- Intentional render-time latch (usePrevious-style): once the models have finished loading, they are considered loaded for the lifetime of this hook. The ref must be read and written during render so that the latched value is returned within the same render pass; a state-based latch would trigger an extra re-render in every useK8sWatchResource/useK8sWatchResources consumer.
  if (!ref.current && loaded && !inFlight) {
    ref.current = true;
  }
  // eslint-disable-next-line react-hooks-js/refs -- Intentional render-time latch, see the comment above
  return ref.current;
};
