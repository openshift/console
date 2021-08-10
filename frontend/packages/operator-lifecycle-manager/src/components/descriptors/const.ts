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

export const DEPRECATED_CAPABILITIES: SpecCapability[] = [
  SpecCapability.arrayFieldGroup,
  SpecCapability.fieldGroup,
  SpecCapability.namespaceSelector,
  SpecCapability.label,
];

export const COMMON_COMPATIBLE_CAPABILITIES: SpecCapability[] = [
  SpecCapability.advanced,
  SpecCapability.fieldDependency,
  SpecCapability.hidden,
  // TODO remove when deprecated descriptors are no longer supported
  SpecCapability.arrayFieldGroup,
  SpecCapability.fieldGroup,
  // END TODO
];

export const OBJECT_COMPATIBLE_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  StatusCapability.podStatuses,
  SpecCapability.updateStrategy,
  SpecCapability.nodeAffinity,
  SpecCapability.podAffinity,
  SpecCapability.podAntiAffinity,
  SpecCapability.resourceRequirements,
  SpecCapability.selector,
  // TODO remove when deprecated descriptors are no longer supported
  SpecCapability.label,
  SpecCapability.namespaceSelector,
  // END TODO
];

export const ARRAY_COMPATIBLE_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  SpecCapability.endpointList,
  StatusCapability.conditions,
];

export const PRIMITIVE_COMPATIBLE_CAPABILITIES: (SpecCapability | StatusCapability)[] = [
  StatusCapability.k8sPhase,
  StatusCapability.k8sPhaseReason,
  SpecCapability.k8sResourcePrefix,
  SpecCapability.imagePullPolicy,
  SpecCapability.podCount,
  SpecCapability.select,
  StatusCapability.w3Link,
  SpecCapability.booleanSwitch,
  SpecCapability.checkbox,
  SpecCapability.password,
  SpecCapability.text,
  StatusCapability.text,
  SpecCapability.number,
  // TODO remove when deprecated descriptors are no longer supported
  SpecCapability.label,
  // END TODO
];

export const CAPABILITY_SORT_ORDER: (SpecCapability | StatusCapability)[] = [
  // Supported in details view and has a widget
  SpecCapability.hidden,
  SpecCapability.endpointList,
  StatusCapability.conditions,
  SpecCapability.resourceRequirements,
  SpecCapability.updateStrategy,
  StatusCapability.podStatuses,
  SpecCapability.selector,
  SpecCapability.k8sResourcePrefix,
  SpecCapability.podCount,
  SpecCapability.password,
  StatusCapability.k8sPhaseReason,
  SpecCapability.booleanSwitch,
  SpecCapability.checkbox,
  StatusCapability.w3Link,

  // Supported in details view with no widget
  SpecCapability.select,
  SpecCapability.imagePullPolicy,
  StatusCapability.k8sPhase,
  SpecCapability.text,
  StatusCapability.text,
  SpecCapability.number,

  // Unsupported on details view
  SpecCapability.podAntiAffinity,
  SpecCapability.podAffinity,
  SpecCapability.nodeAffinity,

  // Always last
  SpecCapability.advanced,
  SpecCapability.fieldDependency,
  ...DEPRECATED_CAPABILITIES,
];
