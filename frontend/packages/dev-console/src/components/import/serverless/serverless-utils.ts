import { apiVersionForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin/src';
import { AutoscaleWindowType } from '../import-types';

export const getAutoscaleWindow = (autoscaleValue: string): AutoscaleWindowType => {
  const windowRegEx = /^[0-9]+|[a-zA-Z]*/g;
  const [val, unit] = autoscaleValue?.match(windowRegEx);
  return {
    autoscalewindow: Number(val) || '',
    autoscalewindowUnit: unit || 's',
    defaultAutoscalewindowUnit: unit || 's',
  };
};

const DOMAIN_MAPPING_KSVC_INFO_REGEX = / *\([^)]*\) */g;

export const removeKsvcInfoFromDomainMapping = (dm: string) =>
  dm.replace(DOMAIN_MAPPING_KSVC_INFO_REGEX, '');

export const getOtherKsvcFromDomainMapping = (
  dm: K8sResourceKind,
  currentKsvcName: string,
): string | null => {
  if (!dm.spec?.ref) return null;
  const { apiVersion, kind, name } = dm.spec.ref;
  return apiVersionForModel(ServiceModel) === apiVersion &&
    kind === ServiceModel.kind &&
    name !== currentKsvcName
    ? name
    : null;
};

export const removeDuplicateDomainMappings = (
  allDomainMappings: string[],
  connectedDomainMappings: string[],
): string[] => {
  return [
    ...new Set(
      allDomainMappings
        ?.filter((dm) => connectedDomainMappings?.includes(removeKsvcInfoFromDomainMapping(dm)))
        .map((n) => removeKsvcInfoFromDomainMapping(n)),
    ),
  ];
};

export const hasOtherKsvcDomainMappings = (domainMapping: string[]): boolean =>
  domainMapping.some((dm) => new RegExp(DOMAIN_MAPPING_KSVC_INFO_REGEX).test(dm));
