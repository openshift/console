import * as _ from 'lodash-es';

import {
  CRDVersion,
  CustomResourceDefinitionKind,
  GroupVersionKind,
  K8sKind,
  K8sResourceCommon,
  K8sResourceKind,
  K8sResourceKindReference,
  OwnerReference,
  modelFor,
} from './index';

export const getQN: (obj: K8sResourceKind) => string = ({ metadata: { name, namespace } }) =>
  (namespace ? `(${namespace})-` : '') + name;

export const k8sBasePath = `${window.SERVER_FLAGS.basePath}api/kubernetes`;

// TODO(alecmerdler): Replace all manual string building with this function
export const referenceForGroupVersionKind = (group: string) => (version: string) => (
  kind: string,
) => [group, version, kind].join('~');

export const getGroupVersionKind = (
  ref: GroupVersionKind | string,
): [string, string, string] | undefined => {
  const parts = ref.split('~');
  if (parts.length !== 3) {
    return undefined;
  }
  return parts as [string, string, string];
};

export const isGroupVersionKind = (ref: GroupVersionKind | string) => ref.split('~').length === 3;

export const groupVersionFor = (apiVersion: string) => ({
  group: apiVersion.split('/').length === 2 ? apiVersion.split('/')[0] : 'core',
  version: apiVersion.split('/').length === 2 ? apiVersion.split('/')[1] : apiVersion,
});

export const getLatestVersionForCRD = (crdVersions: CRDVersion[], legacyCRDVersion: string) => {
  const served = crdVersions.filter((version) => version.served);
  const sorted = served.sort((v1, v2) => {
    // First sort on major version
    const majorV1 = _.toNumber(v1.name.match(/\d+/)[0]);
    const majorV2 = _.toNumber(v2.name.match(/\d+/)[0]);
    if (majorV1 !== majorV2) {
      return majorV2 - majorV1;
    }
    // Then sort on numerical release only
    if (!v1.name.match(/^(alpha|beta)$/)) {
      return -1;
    }
    if (!v2.name.match(/^(alpha|beta)$/)) {
      return 1;
    }
    // Beta beats alpha
    const isBetaV1 = v1.name.match(/^(beta)$/);
    const isBetaV2 = v2.name.match(/^(beta)$/);
    if (isBetaV1 !== isBetaV2) {
      return isBetaV1 ? -1 : 1;
    }
    // Finally compare minor version
    const minorV1 = _.toNumber(v1.name.match(/\d+/)[1]);
    const minorV2 = _.toNumber(v2.name.match(/\d+/)[1]);
    return minorV2 - minorV1;
  });
  return sorted && sorted.length > 0 ? sorted[0].name : legacyCRDVersion;
};

export const referenceForCRD = (obj: CustomResourceDefinitionKind): GroupVersionKind =>
  referenceForGroupVersionKind(obj.spec.group)(
    getLatestVersionForCRD(obj.spec.versions, obj.spec.version),
  )(obj.spec.names.kind);

export const referenceForOwnerRef = (ownerRef: OwnerReference): GroupVersionKind =>
  referenceForGroupVersionKind(groupVersionFor(ownerRef.apiVersion).group)(
    groupVersionFor(ownerRef.apiVersion).version,
  )(ownerRef.kind);

export const referenceForModel = (model: K8sKind): GroupVersionKind =>
  referenceForGroupVersionKind(model.apiGroup || 'core')(model.apiVersion)(model.kind);

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

export const kindForReference = (ref: K8sResourceKindReference) =>
  isGroupVersionKind(ref) ? ref.split('~')[2] : ref;

export const apiGroupForReference = (ref: GroupVersionKind) => ref.split('~')[0];

export const versionForReference = (ref: GroupVersionKind) => ref.split('~')[1];

export const apiVersionForModel = (model: K8sKind) =>
  _.isEmpty(model.apiGroup) ? model.apiVersion : `${model.apiGroup}/${model.apiVersion}`;

export const apiVersionForReference = (ref: GroupVersionKind) =>
  isGroupVersionKind(ref) ? `${ref.split('~')[0]}/${ref.split('~')[1]}` : ref;

export const nameForModel = (model: K8sKind) => [model.plural, model.apiGroup].join('.');
