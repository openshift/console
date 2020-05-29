import * as _ from 'lodash';
import { JSONSchema6 } from 'json-schema';
import { getSchemaType } from 'react-jsonschema-form/lib/utils';
import { SchemaType } from './types';
import { UiSchema } from 'react-jsonschema-form';

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
    ..._.map(
      _.intersection(_.keys(schema), UNSUPPORTED_SCHEMA_PROPERTIES),
      (unsupportedProperty) => ({
        title: 'Unsupported Property',
        message: `Cannot generate form fields for JSON schema with ${unsupportedProperty} property.`,
      }),
    ),
  ];
};

// Determine if a schema will produce no form fields.
export const hasNoFields = (jsonSchema: JSONSchema6 = {}, uiSchema: UiSchema = {}): boolean => {
  // If schema is empty or has unsupported properties, it will not render any fields on the form
  if (getSchemaErrors(jsonSchema).length > 0) {
    return true;
  }

  const type = getSchemaType(jsonSchema) ?? '';
  const noUIFieldOrWidget = !uiSchema?.['ui:field'] && !uiSchema?.['ui:widget'];
  switch (type) {
    case SchemaType.array:
      return noUIFieldOrWidget && hasNoFields(jsonSchema.items as JSONSchema6, uiSchema?.items);
    case SchemaType.object:
      return (
        noUIFieldOrWidget &&
        _.every(jsonSchema?.properties, (property, propertyName) =>
          hasNoFields(property as JSONSchema6, uiSchema?.[propertyName]),
        )
      );
    case SchemaType.boolean:
    case SchemaType.integer:
    case SchemaType.number:
    case SchemaType.string:
      return false;
    default:
      return noUIFieldOrWidget;
  }
};

type SchemaError = {
  title: string;
  message: string;
};
