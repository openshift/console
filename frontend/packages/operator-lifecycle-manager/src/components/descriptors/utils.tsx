import * as _ from 'lodash';
import {
  REGEXP_ARRAY_PATH,
  REGEXP_CAPTURE_GROUP_SUBGROUP,
  REGEXP_NESTED_ARRAY_PATH,
} from './const';
import { Descriptor } from './types';

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

    // Nested arrays are not supported
    if (REGEXP_NESTED_ARRAY_PATH.test(descriptor.path)) {
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
