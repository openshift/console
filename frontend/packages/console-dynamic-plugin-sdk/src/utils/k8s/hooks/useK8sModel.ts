// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { UseK8sModel } from '../../../extensions/console-types';
import { getGroupVersionKindForReference, transformGroupVersionKindToReference } from '../k8s-ref';

/**
 * Hook that retrieves the k8s model for provided K8sGroupVersionKind from redux.
 * @param groupVersionKind K8sGroupVersionKind should be provided
 * @return An array with the first item as k8s model and second item as inFlight status
 * @example
 * ```ts
 * const Component: React.FC = () => {
 *   const [model, inFlight] = useK8sModel({ group: 'app'; version: 'v1'; kind: 'Deployment' });
 *   return ...
 * }
 * ```
 */
export const useK8sModel: UseK8sModel = (k8sGroupVersionKind) => {
  const kindReference = transformGroupVersionKindToReference(k8sGroupVersionKind);
  return [
    useSelector(({ k8s }) =>
      kindReference
        ? k8s.getIn(['RESOURCES', 'models', kindReference]) ??
          k8s.getIn(['RESOURCES', 'models', getGroupVersionKindForReference(kindReference).kind])
        : undefined,
    ),
    useSelector(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight']) ?? false),
  ];
};
