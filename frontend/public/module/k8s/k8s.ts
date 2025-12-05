import { ExtensionK8sGroupModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  GroupVersionKind,
  K8sResourceCommon,
  OwnerReference,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { modelFor } from './k8s-models';
import { referenceForGroupVersionKind, referenceForModel } from './k8s-ref';
import { K8sKind, K8sResourceKind } from './types';

export * from './crd-versions';
export * from './k8s-ref';
export * from './for-ref';
export { k8sBasePath } from './consts';

export const getQN: (obj: K8sResourceKind) => string = (obj) => {
  const { name, namespace } = obj.metadata;
  // Name + namespace is not unique for PackageManifest resources, so include the catalog source.
  // TODO: We should be able to remove this when the upstream OLM bug is fixed:
  //       https://bugzilla.redhat.com/show_bug.cgi?id=1814822
  if (obj.apiVersion === 'packages.operators.coreos.com/v1' && obj.kind === 'PackageManifest') {
    return `(${obj.status?.catalogSource})-${name}`;
  }
  return (namespace ? `(${namespace})-` : '') + name;
};

export const getGroupVersionKind = (
  ref: GroupVersionKind | string,
): [string, string, string] | undefined => {
  const parts = ref.split('~');
  if (parts.length !== 3) {
    return undefined;
  }
  return parts as [string, string, string];
};

export const groupVersionFor = (apiVersion: string) => ({
  group: apiVersion.split('/').length === 2 ? apiVersion.split('/')[0] : 'core',
  version: apiVersion.split('/').length === 2 ? apiVersion.split('/')[1] : apiVersion,
});

export const referenceForOwnerRef = (ownerRef: OwnerReference): GroupVersionKind =>
  referenceForGroupVersionKind(groupVersionFor(ownerRef.apiVersion).group)(
    groupVersionFor(ownerRef.apiVersion).version,
  )(ownerRef.kind);

export const referenceForExtensionModel = (model: ExtensionK8sGroupModel): GroupVersionKind =>
  referenceForGroupVersionKind(model?.group || 'core')(model?.version)(model?.kind);

export const referenceFor = ({ kind, apiVersion }: K8sResourceCommon): GroupVersionKind => {
  if (!kind) {
    return '';
  }

  // `apiVersion` is optional in some k8s object references (for instance,
  // event `involvedObject`). The CLI resolves the version from API discovery.
  // Use `modelFor` to get the version from the model when missing.
  if (!apiVersion) {
    const m = modelFor(kind);
    return m ? referenceForModel(m) : '';
  }

  const { group, version } = groupVersionFor(apiVersion);
  return referenceForGroupVersionKind(group)(version)(kind);
};

export const nameForModel = (model: K8sKind) => [model.plural, model.apiGroup].join('.');
