import * as _ from 'lodash-es';

import {
  CustomResourceDefinitionKind,
  GroupVersionKind,
  K8sKind,
  K8sResourceCommon,
  K8sResourceKind,
  K8sResourceKindReference,
  OwnerReference,
  modelFor,
} from './index';

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

const parseAPIVersion = (version: string) => {
  const parsed = /^v(\d+)(?:(alpha|beta)(\d+))?$/.exec(version);
  return parsed
    ? { majorVersion: Number(parsed[1]), qualifier: parsed[2], minorVersion: Number(parsed[3]) }
    : null;
};

export const apiVersionCompare = (v1: string, v2: string) => {
  const v1Parsed = parseAPIVersion(v1);
  const v2Parsed = parseAPIVersion(v2);

  // Check null parsed versions first
  if (!v1Parsed || !v2Parsed) {
    // If a value fails null check order it last
    if (v1Parsed) {
      return -1;
    }
    if (v2Parsed) {
      return 1;
    }
    return v1.localeCompare(v2);
  }
  // Then sort on major version with no qualifiers: v3 > v1
  if (
    v1Parsed.majorVersion !== v2Parsed.majorVersion &&
    !v1Parsed.qualifier &&
    !v2Parsed.qualifier
  ) {
    return v2Parsed.majorVersion - v1Parsed.majorVersion;
  }
  // Then sort on any version with no qualifier over a qualifier: v1 > v3alpha
  if (_.isEmpty(v1Parsed.qualifier) !== _.isEmpty(v2Parsed.qualifier)) {
    return v1Parsed.qualifier ? 1 : -1;
  }
  // Beta beats alpha: v1beta1 > v1alpha1
  const isBetaV1 = v1Parsed.qualifier === 'beta';
  const isBetaV2 = v2Parsed.qualifier === 'beta';
  if (isBetaV1 !== isBetaV2) {
    return isBetaV1 ? -1 : 1;
  }
  // Same qualifier, then numeric values win: v2beta2 > v1beta2
  if (v1Parsed.majorVersion !== v2Parsed.majorVersion) {
    return v2Parsed.majorVersion - v1Parsed.majorVersion;
  }
  // Finally compare minor version: v1beta2 > v1beta1
  return v2Parsed.minorVersion - v1Parsed.minorVersion;
};

export const getLatestVersionForCRD = (crd: CustomResourceDefinitionKind) => {
  const sorted = crd.spec.versions
    ?.filter((version) => version.served)
    ?.map(({ name }) => name)
    ?.sort(apiVersionCompare);
  return sorted[0];
};

export const referenceForCRD = (obj: CustomResourceDefinitionKind): GroupVersionKind =>
  referenceForGroupVersionKind(obj.spec.group)(getLatestVersionForCRD(obj))(obj.spec.names.kind);

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
