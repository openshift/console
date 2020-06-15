import * as _ from 'lodash';
import { SpecCapability } from './types';

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
