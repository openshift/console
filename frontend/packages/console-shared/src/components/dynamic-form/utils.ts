import * as _ from 'lodash';
import { JSONSchema6 } from 'json-schema';
import { UiSchema } from 'react-jsonschema-form';
import { getUiOptions } from 'react-jsonschema-form/lib/utils';

const UNSUPPORTED_SCHEMA_PROPERTIES = ['allOf', 'anyOf', 'oneOf'];

export const useSchemaLabel = (schema: JSONSchema6, uiSchema: UiSchema, defaultLabel?: string) => {
  const options = getUiOptions(uiSchema ?? {});
  const showLabel = options?.label ?? true;
  const label = (options?.title || schema?.title || defaultLabel) as string;
  return [showLabel, label] as [boolean, string];
};

export const useSchemaDescription = (
  schema: JSONSchema6,
  uiSchema: UiSchema,
  defaultDescription?: string,
) =>
  (getUiOptions(uiSchema ?? {})?.description ||
    schema?.description ||
    defaultDescription) as string;

export const getSchemaErrors = (schema: JSONSchema6): SchemaError[] => {
  return [
    ...(_.isEmpty(schema)
      ? [
          {
            title: 'Empty Schema',
            message: 'Schema is empty.',
          },
        ]
      : []),
    ..._.map(
      _.intersection(_.keys(schema), UNSUPPORTED_SCHEMA_PROPERTIES),
      (unsupportedProperty) => ({
        title: 'Unsupported Property',
        message: `Cannot generate form fields for JSON schema with ${unsupportedProperty} property.`,
      }),
    ),
  ];
};

// Returns true if a value is not nil and is empty
const definedAndEmpty = (value) => !_.isNil(value) && _.isEmpty(value);

// Helper function for prune
// TODO (jon) Make this pure
const pruneRecursive = (current: any, sample: any): any => {
  const valueIsEmpty = (value, key) =>
    _.isNil(value) ||
    _.isNaN(value) ||
    (_.isString(value) && _.isEmpty(value)) ||
    (_.isObject(value) && _.isEmpty(pruneRecursive(value, sample?.[key])));

  // Value should be pruned if it is empty and the correspondeing sample is not explicitly
  // defined as an empty value.
  const shouldPrune = (value, key) => valueIsEmpty(value, key) && !definedAndEmpty(sample?.[key]);

  // Prune each property of current value that meets the pruning criteria
  _.forOwn(current, (value, key) => {
    if (shouldPrune(value, key)) {
      delete current[key];
    }
  });

  // remove any leftover undefined values from the delete operation on an array
  if (_.isArray(current)) {
    _.pull(current, undefined);
  }

  return current;
};

// Deeply remove all empty, NaN, null, or undefined values from an object or array. If a value meets
// the above criteria, but the corresponding sample is explicitly defined as an empty vaolue, it
// will not be pruned.
// Based on https://stackoverflow.com/a/26202058/8895304
export const prune = (obj: any, sample?: any): any => {
  return pruneRecursive(_.cloneDeep(obj), sample);
};

type SchemaError = {
  title: string;
  message: string;
};
