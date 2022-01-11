import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
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
 * @param groupVersionKind group, version, kind of k8s resource {@link K8sGroupVersionKind} is preferred alternatively can pass reference for group, version, kind which is deprecated i.e `group~version~kind` {@link K8sResourceKindReference}.
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
  useSelector<RootState, K8sModel>(({ k8s }) => getK8sModel(k8s, k8sGroupVersionKind)),
  useSelector<RootState, boolean>(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight']) ?? false),
];
