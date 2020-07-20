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

type SchemaError = {
  title: string;
  message: string;
};
