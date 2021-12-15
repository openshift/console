// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import {
  UseK8sModel,
  K8sResourceKindReference,
  K8sGroupVersionKind,
} from '../../../extensions/console-types';
import { getGroupVersionKindForReference, transformGroupVersionKindToReference } from '../k8s-ref';

export const getK8sModel = (
  k8s,
  k8sGroupVersionKind?: K8sResourceKindReference | K8sGroupVersionKind,
): K8sModel => {
  const kindReference = transformGroupVersionKindToReference(k8sGroupVersionKind);
  return kindReference
    ? k8s.getIn(['RESOURCES', 'models', kindReference]) ??
        k8s.getIn(['RESOURCES', 'models', getGroupVersionKindForReference(kindReference).kind])
    : undefined;
};

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
export const useK8sModel: UseK8sModel = (k8sGroupVersionKind) => [
  useSelector(({ sdkK8s }) => getK8sModel(sdkK8s, k8sGroupVersionKind)),
  useSelector(({ sdkK8s }) => sdkK8s.getIn(['RESOURCES', 'inFlight']) ?? false),
];
