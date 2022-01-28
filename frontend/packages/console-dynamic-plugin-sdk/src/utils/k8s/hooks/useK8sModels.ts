// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { UseK8sModels } from '../../../extensions/console-types';

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
  useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'models']))?.toJS() ?? {},
  useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight'])) ?? false,
];
