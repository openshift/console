import * as _ from 'lodash';
import { SpecCapability, StatusCapability } from './types';

export const REGEXP_K8S_RESOURCE_CAPABILITY = _.escapeRegExp(SpecCapability.k8sResourcePrefix);
export const REGEXP_FIELD_DEPENDENCY_CAPABILITY = _.escapeRegExp(SpecCapability.fieldDependency);
export const REGEXP_SELECT_CAPABILITY = _.escapeRegExp(SpecCapability.select);

export const REGEXP_K8S_RESOURCE_SUFFIX = new RegExp(
  `^${REGEXP_K8S_RESOURCE_CAPABILITY}(?:core[:~]v1[:~])?(.*)$`,
);
export const REGEXP_SELECT_OPTION = new RegExp(`${REGEXP_SELECT_CAPABILITY}(.*)$`);
export const REGEXP_FIELD_DEPENDENCY_PATH_VALUE = new RegExp(
  `^${REGEXP_FIELD_DEPENDENCY_CAPABILITY}([^:]*):(.*)$`,
);

// Matches a path string containing an array reference. Captures
// the segment before the array reference, and the segment after.
// For example:
//    path[0].element.property -> [path, element.property]
export const REGEXP_ARRAY_PATH = /^(.*)\[\d+\]\.?(.*)$/;

// Matches a path string with multiple array references.
// e.g.:  nested[0].array[0].property
export const REGEXP_NESTED_ARRAY_PATH = /^.*\[\d+\]\.?.*\[\d+\]\.?.*$/;

//  Captures the root segment of a path string, and all desscendent segments as
// a single string.
// For example:
//    'this.is.a.really.long.path' -> ['this', 'is.a.really.long.path'])
//    'this'  -> ['this']
export const REGEXP_CAPTURE_GROUP_SUBGROUP = /^([^.]*)\.?(.*)$/;

export const DEPRECATED_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  SpecCapability.arrayFieldGroup,
  SpecCapability.fieldGroup,
  SpecCapability.label,
  SpecCapability.namespaceSelector,
];

export const OBJECT_COMPATIBLE_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  SpecCapability.advanced,
  SpecCapability.fieldDependency,
  SpecCapability.hidden,
  SpecCapability.namespaceSelector,
  SpecCapability.nodeAffinity,
  SpecCapability.podAffinity,
  SpecCapability.podAntiAffinity,
  SpecCapability.resourceRequirements,
  SpecCapability.selector,
  SpecCapability.updateStrategy,
  StatusCapability.podStatuses,
];

export const ARRAY_COMPATIBLE_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  SpecCapability.advanced,
  SpecCapability.endpointList,
  SpecCapability.fieldDependency,
  SpecCapability.hidden,
  StatusCapability.conditions,
];

export const PRIMITIVE_COMPATIBLE_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  SpecCapability.advanced,
  SpecCapability.booleanSwitch,
  SpecCapability.checkbox,
  SpecCapability.fieldDependency,
  SpecCapability.hidden,
  SpecCapability.imagePullPolicy,
  SpecCapability.k8sResourcePrefix,
  SpecCapability.number,
  SpecCapability.password,
  SpecCapability.podCount,
  SpecCapability.select,
  SpecCapability.text,
  StatusCapability.w3Link,
  StatusCapability.text,
  StatusCapability.k8sPhase,
  StatusCapability.k8sPhaseReason,
  StatusCapability.k8sResourcePrefix,
];
