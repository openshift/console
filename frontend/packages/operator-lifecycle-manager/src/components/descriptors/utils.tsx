import { getSchemaType } from '@rjsf/core/dist/cjs/utils';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { getSchemaAtPath } from '@console/shared';
import {
  ARRAY_COMPATIBLE_CAPABILITIES,
  DEPRECATED_CAPABILITIES,
  OBJECT_COMPATIBLE_CAPABILITIES,
  PRIMITIVE_COMPATIBLE_CAPABILITIES,
  REGEXP_ARRAY_PATH,
  REGEXP_CAPTURE_GROUP_SUBGROUP,
  REGEXP_NESTED_ARRAY_PATH,
  COMMON_COMPATIBLE_CAPABILITIES,
  CAPABILITY_SORT_ORDER,
} from './const';
import { Descriptor, SpecCapability, StatusCapability, CommonCapability } from './types';

export const useCalculatedDescriptorProperties = (descriptorType, descriptor, schema, obj) => {
  const propertySchema = getSchemaAtPath(schema, `${descriptorType}.${descriptor.path}`);
  const fullPath = [descriptorType, ..._.toPath(descriptor.path)];
  const displayName =
    descriptor.displayName || propertySchema?.title || _.startCase(_.last(fullPath));
  const description = descriptor?.description || propertySchema?.description || '';
  const value = _.get(obj, fullPath, descriptor.value);
  return {
    description,
    displayName,
    fullPath,
    propertySchema,
    value,
  };
};

// Creates a structure for rendering grouped descriptors on the operand details page.
export const groupDescriptorDetails = (
  descriptors: Descriptor[],
): { [group: string]: DescriptorGroup } =>
  descriptors.reduce((acc, descriptor) => {
    const handleArrayDescriptor = () => {
      const [, beforeIndex, afterIndex] = descriptor.path.match(REGEXP_ARRAY_PATH) ?? [];
      const [, group, subgroup] = beforeIndex?.match(REGEXP_CAPTURE_GROUP_SUBGROUP) ?? [];
      return subgroup
        ? {
            ...acc,
            [group]: {
              ...(acc?.[group] ?? {}),
              nested: {
                ...(acc?.[group]?.nested ?? {}),
                [subgroup]: {
                  ...(acc?.[group]?.nested?.[subgroup] ?? {}),
                  arrayGroupPath: beforeIndex,
                  isArrayGroup: true,
                  ...(afterIndex
                    ? {
                        nested: {
                          ...(acc?.[group]?.nested?.[subgroup]?.nested ?? {}),
                          [afterIndex]: descriptor,
                        },
                      }
                    : { elementDescriptor: descriptor }),
                },
              },
            },
          }
        : {
            ...acc,
            [group]: {
              ...(acc?.[group] ?? {}),
              arrayGroupPath: beforeIndex,
              isArrayGroup: true,
              ...(afterIndex
                ? {
                    nested: {
                      ...(acc?.[group]?.nested ?? {}),
                      [afterIndex]: descriptor,
                    },
                  }
                : { elementDescriptor: descriptor }),
            },
          };
    };

    // Ignore nested arrays and hidden descriptors.
    if (
      REGEXP_NESTED_ARRAY_PATH.test(descriptor.path) ||
      descriptor?.['x-descriptors']?.includes(CommonCapability.hidden)
    ) {
      return acc;
    }

    if (REGEXP_ARRAY_PATH.test(descriptor.path)) {
      return handleArrayDescriptor();
    }

    const [, group, subgroup] = descriptor.path.match(REGEXP_CAPTURE_GROUP_SUBGROUP) ?? [];
    return group
      ? {
          ...acc,
          [group]: {
            ...(acc?.[group] ?? {}),
            ...(subgroup
              ? {
                  nested: {
                    ...(acc?.[group]?.nested ?? {}),
                    [subgroup]: {
                      ...(acc?.[group]?.nested?.[subgroup] ?? {}),
                      descriptor,
                    },
                  },
                }
              : { descriptor }),
          },
        }
      : acc;
  }, {});

// Replace '.', '[', and '].' with '/'.
export const getPatchPathFromDescriptor = (descriptor: Descriptor): string =>
  _.toPath(descriptor.path).join('/');

// Given a type, return a static list of x-descriptors that are compatible
const getCompatibleCapabilities = (type: string): (StatusCapability | SpecCapability)[] => {
  switch (type) {
    case 'object':
      return [...COMMON_COMPATIBLE_CAPABILITIES, ...OBJECT_COMPATIBLE_CAPABILITIES];
    case 'array':
      return [...COMMON_COMPATIBLE_CAPABILITIES, ...ARRAY_COMPATIBLE_CAPABILITIES];
    default:
      return [...COMMON_COMPATIBLE_CAPABILITIES, ...PRIMITIVE_COMPATIBLE_CAPABILITIES];
  }
};

// Given type and descriptor, return a list of non-deprecated x-descriptors compatible with type.
// Deprecated and incompatible x-descriptors are logged as warnings in console. If
// 'allowDeprecated' is true, deprecated x-descriptors are logged but still returned as valid.
export function getValidCapabilitiesForDataType<CapabilityType extends string = SpecCapability>(
  descriptor: Descriptor<CapabilityType>,
  type: string,
): CapabilityType[] {
  const compatibleCapabilities = getCompatibleCapabilities(type);
  return (descriptor?.['x-descriptors'] ?? [])
    .filter((capability) => {
      const isCompatible =
        type === 'any' ||
        compatibleCapabilities.some((compatibleCapability) =>
          capability.startsWith(compatibleCapability),
        );
      const isDeprecated = DEPRECATED_CAPABILITIES.some((deprecatedCapability) =>
        capability.startsWith(deprecatedCapability),
      );

      if (isDeprecated) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Deprecated x-descriptor] "${capability}" is deprecated and support will be removed in a future release.`,
          descriptor,
        );
      }

      if (!isCompatible) {
        // eslint-disable-next-line no-console
        console.warn(
          `[Invalid x-descriptor] "${capability}" is incompatible with ${type} values and will have no effect`,
          descriptor,
        );
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aIndex = CAPABILITY_SORT_ORDER.findIndex((capability) => a.startsWith(capability));
      const bIndex = CAPABILITY_SORT_ORDER.findIndex((capability) => b.startsWith(capability));
      // If either a or b don't exist in the sorting array, sort the missing item last
      if (aIndex < 0 || bIndex < 0) {
        return bIndex - aIndex;
      }
      return aIndex - bIndex;
    });
}

const getValueType = (value: any): string => {
  // Consider nil values 'any' since every descriptor should render empty state in this case
  if (_.isNil(value)) {
    return 'any';
  }

  // Array check must come before object check because _.isObject will return true on array values
  return _.isArray(value) ? 'array' : _.isObject(value) ? 'object' : 'primitive';
};

export function getValidCapabilitiesForValue<CapabilityType extends string = SpecCapability>(
  descriptor: Descriptor<CapabilityType>,
  value: any,
): CapabilityType[] {
  const type = getValueType(value);
  return getValidCapabilitiesForDataType<CapabilityType>(descriptor, type);
}

export function getValidCapabilitiesForSchema<CapabilityType extends string = SpecCapability>(
  descriptor: Descriptor<CapabilityType>,
  schema: JSONSchema7,
): CapabilityType[] {
  const type = getSchemaType(schema);
  return getValidCapabilitiesForDataType<CapabilityType>(descriptor, type);
}

export const isMainStatusDescriptor = (descriptor: Descriptor): boolean =>
  descriptor.path === 'status' || descriptor.displayName === 'Status';

export type DescriptorGroup = {
  arrayGroupPath?: string; // Path to the array that this descriptor group represents
  descriptor?: Descriptor; // Descriptor for the root level group.
  elementDescriptor?: Descriptor; // For array groups, the descriptor that applies to each array element
  isArrayGroup?: boolean; // True if this group describes an array property
  // Descriptor groups which are encompassed by this group
  nested?: {
    [key: string]: DescriptorGroup;
  };
};
