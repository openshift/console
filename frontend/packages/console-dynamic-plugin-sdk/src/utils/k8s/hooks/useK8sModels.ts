import { useSelector } from 'react-redux';
import type { SDKStoreState } from '../../../app/redux-types';
import type { UseK8sModels } from '../../../extensions/console-types';
import type { K8sModel } from '../../../lib-core';

const EMPTY_MODELS: { [key: string]: K8sModel } = {};

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
export const useK8sModels: UseK8sModels = () => [
  useSelector<SDKStoreState, { [key: string]: K8sModel }>(
    ({ k8s }) => k8s.RESOURCES?.models ?? EMPTY_MODELS,
  ),
  useSelector<SDKStoreState, boolean>(({ k8s }) => k8s.RESOURCES?.inFlight ?? false),
];
