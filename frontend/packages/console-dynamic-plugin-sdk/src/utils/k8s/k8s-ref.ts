import { K8sModel } from '../../api/common-types';
import {
  GetAPIVersionForModel,
  GetGroupVersionKindForResource,
  GetGroupVersionKindForModel,
} from '../../api/k8s-types';
import { K8sGroupVersionKind, K8sResourceKindReference } from '../../extensions/console-types';

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind Pass K8sGroupVersionKind which will have group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind.group Pass group of k8s resource or model.
 * @param K8sGroupVersionKind.version Pass version of k8s resource or model.
 * @param K8sGroupVersionKind.kind Pass kind of k8s resource or model.
 * @return The reference for any k8s resource i.e `group~version~kind`.
 * If the group will not be present then "core" will be returned as part of the group in reference.
 * * */
export const getReference = ({
  group,
  version,
  kind,
}: K8sGroupVersionKind): K8sResourceKindReference => [group || 'core', version, kind].join('~');

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * @see getGroupVersionKindForModel
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s model.
 * @param model k8s model
 * @return The reference for model i.e `group~version~kind`.
 * * */
export const getReferenceForModel = (model: K8sModel): K8sResourceKindReference =>
  getReference({ group: model.apiGroup, version: model.apiVersion, kind: model.kind });

/**
 * Provides apiVersion for a k8s model.
 * @param model k8s model
 * @returns The apiVersion for the model i.e `group/version`.
 * */
export const getAPIVersionForModel: GetAPIVersionForModel = (model) =>
  !model?.apiGroup ? model.apiVersion : `${model.apiGroup}/${model.apiVersion}`;

/**
 * Provides a group, version, and kind for a resource.
 * @param resource k8s resource
 * @returns The group, version, kind for the provided resource.
 * If the resource does not have an API group, group "core" will be returned.
 * If the resource has an invalid apiVersion then it'll throw Error.
 * */
export const getGroupVersionKindForResource: GetGroupVersionKindForResource = (resource) => {
  const { apiVersion, kind } = resource;
  const apiVersionSplit = apiVersion.split('/');
  const apiVersionSplitLen = apiVersionSplit.length;
  if (apiVersionSplitLen > 2) throw new Error('Provided resource has invalid apiVersion.');

  return {
    ...(apiVersionSplitLen === 2 && {
      group: apiVersionSplit[0],
    }),
    version: apiVersionSplitLen === 2 ? apiVersionSplit[1] : apiVersion,
    kind,
  };
};

/**
 * Provides a group, version, and kind for a k8s model.
 * @param model k8s model
 * @returns The group, version, kind for the provided model.
 * If the model does not have an apiGroup, group "core" will be returned.
 * */
export const getGroupVersionKindForModel: GetGroupVersionKindForModel = ({
  apiGroup,
  apiVersion: version,
  kind,
}) => ({
  ...(apiGroup && { group: apiGroup }),
  version,
  kind,
});

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a group, version, and kind for a reference.
 * @param reference reference for group, version, kind i.e `group~version~kind`.
 * @returns The group, version, kind for the provided reference.
 * If the group's value is "core" it denotes resource does not have an API group.
 * */
export const getGroupVersionKindForReference = (
  reference: K8sResourceKindReference,
): K8sGroupVersionKind => {
  const referenceSplit = reference.split('~');
  if (referenceSplit.length > 3) throw new Error('Provided reference is invalid.');

  const [group, version, kind] = referenceSplit;
  return {
    group,
    version,
    kind,
  };
};

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a reference string that uniquely identifies the group, version, and kind of K8sGroupVersionKind.
 * @param kind kind can be of type K8sResourceKindReference or K8sGroupVersionKind
 * @return The reference i.e `group~version~kind`.
 * * */
export const transformGroupVersionKindToReference = (
  kind: K8sResourceKindReference | K8sGroupVersionKind,
): K8sResourceKindReference =>
  kind && typeof kind !== 'string' ? getReference(kind) : (kind as K8sResourceKindReference);
