import * as _ from 'lodash';
import * as Immutable from 'immutable';
import { JSONSchema6 } from 'json-schema';
import { UiSchema } from 'react-jsonschema-form';
import { getSchemaType } from 'react-jsonschema-form/lib/utils';
import { SchemaType } from './types';
import { SORT_WEIGHT_SCALE_1, SORT_WEIGHT_SCALE_2, SORT_WEIGHT_SCALE_3 } from './const';

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

// Given a JSONSchema and associated uiSchema, create the appropriat ui schema order property for
// the jsonSchema. Orders properties according to the following rules:
//  - required properties with an associated ui schema come first,
//  - required properties without an associated ui schema next,
//  - optional fields with an associated ui schema next,
//  - all other properties
export const getJSONSchemaOrder = (jsonSchema, uiSchema) => {
  const type = getSchemaType(jsonSchema ?? {});
  const handleArray = () => {
    const descendantOrder = getJSONSchemaOrder(jsonSchema?.items as JSONSchema6, uiSchema?.items);
    return !_.isEmpty(descendantOrder) ? { items: descendantOrder } : {};
  };

  const handleObject = () => {
    const propertyNames = _.keys(jsonSchema?.properties ?? {});
    if (_.isEmpty(propertyNames)) {
      return {};
    }

    // Map control fields to an array so that  an index can be used to apply a modifier to sort
    // weigths of dependent fields
    const controlProperties = _.reduce(
      uiSchema,
      (controlPropertyAccumulator, { 'ui:dependency': dependency }) => {
        const control = _.last(dependency?.path ?? []);
        return !control ? controlPropertyAccumulator : [...controlPropertyAccumulator, control];
      },
      [],
    );

    /**
     * Give a property name a sort wieght based on whether it has a descriptor (uiSchema has
     * property), is required, or is a control field for a property with a field dependency. A lower
     * weight means higher sort order. Fields are weighted according to the following criteria:
     *  - Required fields with descriptor - 0 to 999
     *  - Required fields without descriptor 1000 to 1999
     *  - Optional fields with descriptor 2000 to 2999
     *  - Control fields that don't fit any above - 3000 to 3999
     *  - All other fields - Infinity
     *
     * Within each of the above criteria, fields are further weighted based on field dependency:
     *   - Fields without dependency - base weight
     *   - Control field - base weight  + (nth control field) * 100
     *   - Dependent field - corresponding control field weight + 10
     *
     * These weight numbers are arbitrary, but spaced far enough apart to leave room for multiple
     * levels of sorting.
     */
    const getSortWeight = (property: string): number => {
      // This property's control field, if it exists
      const control = _.last<string>(uiSchema?.[property]?.['ui:dependency']?.path ?? []);

      // A small offset that is added to the base weight so that control fields get sorted last
      // within their appropriate group
      const controlOffset = (controlProperties.indexOf(property) + 1) * SORT_WEIGHT_SCALE_2;

      // If this property is a dependent, it's weight is based on it's control property
      if (control) {
        return getSortWeight(control) + controlOffset + SORT_WEIGHT_SCALE_1;
      }

      const isRequired = (jsonSchema?.required ?? []).includes(property);
      const hasDescriptor = uiSchema?.[property];

      // Required fields with a desriptor are sorted first (lowest weight).
      if (isRequired && hasDescriptor) {
        return SORT_WEIGHT_SCALE_3 + controlOffset;
      }

      // Fields that are required, but have no descriptors get sorted next
      if (isRequired) {
        // Add requiredIndex to sort required properties based on there index in required array
        const requiredIndex = (jsonSchema?.required ?? []).indexOf(property);
        return SORT_WEIGHT_SCALE_3 * 2 + requiredIndex + controlOffset;
      }

      // Optional fields with descriptors get sorted next
      if (hasDescriptor) {
        return SORT_WEIGHT_SCALE_3 * 3 + controlOffset;
      }

      // Control fields that don't fit into any of the above criteria come next
      if (controlOffset > 0) {
        return SORT_WEIGHT_SCALE_3 * 4 + controlOffset;
      }

      // All other fields are sorted in the order in which they are encountered in the schema
      return Infinity;
    };

    const uiOrder = Immutable.Set(propertyNames)
      .sortBy(getSortWeight)
      .toJS();

    return {
      ...(uiOrder.length > 1 && { 'ui:order': uiOrder }),
      ..._.reduce(
        jsonSchema?.properties ?? {},
        (orderAccumulator, property, propertyName) => {
          const descendantOrder = getJSONSchemaOrder(property, uiSchema?.[propertyName]);
          if (_.isEmpty(descendantOrder)) {
            return orderAccumulator;
          }
          return {
            ...orderAccumulator,
            [propertyName]: descendantOrder,
          };
        },
        {},
      ),
    };
  };

  switch (type) {
    case SchemaType.array:
      return handleArray();
    case SchemaType.object:
      return handleObject();
    default:
      return {};
  }
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
