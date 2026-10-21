import { GroupVersionKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import * as _ from 'lodash';
import { referenceForGroupVersionKind } from './k8s-ref';
import { CustomResourceDefinitionKind } from './types';

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
