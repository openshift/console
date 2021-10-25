import {
  GetReference,
  GetReferenceForModel,
  GetAPIVersionForModel,
  GetGroupVersionKindForResource,
  GetGroupVersionKindForReference,
} from '../../api/k8s-types';

/**
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind Pass K8sGroupVersionKind which will have group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind.group Pass group of k8s resource or model.
 * @param K8sGroupVersionKind.version Pass version of k8s resource or model.
 * @param K8sGroupVersionKind.kind Pass kind of k8s resource or model.
 * @return The reference for any k8s resource i.e `group~version~kind`.
 * If the group will not be present then "core" will be returned as part of the group in reference.
 * * */
export const getReference: GetReference = ({ group, version, kind }) =>
  [group || 'core', version, kind].join('~');

/**
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s model.
 * @param model k8s model
 * @return The reference for model i.e `group~version~kind`.
 * * */
export const getReferenceForModel: GetReferenceForModel = (model) =>
  getReference({ group: model.apiGroup, version: model.apiVersion, kind: model.kind });

/**
 * Provides apiVersion for a k8s model.
 * @param model k8s model
 * @return The apiVersion for the model i.e `group/version`.
 * * */
export const getAPIVersionForModel: GetAPIVersionForModel = (model) =>
  !model?.apiGroup ? model.apiVersion : `${model.apiGroup}/${model.apiVersion}`;

/**
 * Provides a group, version, and kind for a resource.
 * @param resource k8s resource
 * @return The group, version, kind for the provided resource.
 * If the resource does not have an API group, group "core" will be returned.
 * If the resource has an invalid apiVersion then null will be returned.
 * * */
export const getGroupVersionKindForResource: GetGroupVersionKindForResource = (resource) => {
  const { apiVersion, kind } = resource;
  const apiVersionSplit = apiVersion.split('/');
  const apiVersionSplitLen = apiVersionSplit.length;
  if (apiVersionSplitLen > 2) throw new Error('Provided resource has invalid apiVersion.');

  return {
    group: apiVersionSplitLen === 2 ? apiVersionSplit[0] : 'core',
    version: apiVersionSplitLen === 2 ? apiVersionSplit[1] : apiVersion,
    kind,
  };
};

/**
 * Provides a group, version, and kind for a reference.
 * @param reference reference for group, version, kind i.e `group~version~kind`.
 * @return The group, version, kind for the provided reference.
 * If the group's value is "core" it denotes resource does not have an API group.
 * * */
export const getGroupVersionKindForReference: GetGroupVersionKindForReference = (reference) => {
  const referenceSplit = reference.split('~');
  if (referenceSplit.length > 3) throw new Error('Provided reference is invalid.');

  const [group, version, kind] = referenceSplit;
  return {
    group,
    version,
    kind,
  };
};
