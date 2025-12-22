import { useMemo } from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useSelector } from 'react-redux';
import { SDKStoreState } from '../../../app/redux-types';
import { UseK8sModels } from '../../../extensions/console-types';
import { K8sModel } from '../../../lib-core';

/**
 * Hook that retrieves all current k8s models from redux.
 *
 * @returns An array with the first item as the list of k8s model and second item as inFlight status
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const [models, inFlight] = UseK8sModels();
 *   return ...
 * }
 * ```
 */
export const useK8sModels: UseK8sModels = () => {
  // Select the ImmutableMap directly - do NOT call .toJS() inside selector
  // as it creates a new object on every render, causing infinite re-renders
  // with react-redux 8.x's strict reference equality
  const modelsMap = useSelector<SDKStoreState, ImmutableMap<string, K8sModel> | undefined>(
    ({ k8s }) => k8s.getIn(['RESOURCES', 'models']),
  );

  const inFlight =
    useSelector<SDKStoreState, boolean>(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight'])) ?? false;

  // Memoize the .toJS() conversion based on the ImmutableMap reference
  const models = useMemo(() => modelsMap?.toJS() ?? ({} as { [key: string]: K8sModel }), [
    modelsMap,
  ]);

  return [models, inFlight];
};
