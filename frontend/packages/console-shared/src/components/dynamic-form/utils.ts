import * as _ from 'lodash';
import { JSONSchema6 } from 'json-schema';

const UNSUPPORTED_SCHEMA_PROPERTIES = ['allOf', 'anyOf', 'oneOf'];

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
    ...(_.isArray(schema.type)
      ? [
          {
            title: 'Unsupported Type Array',
            message: `Cannot generate form fields for JSON schema with type defined as an array.`,
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
