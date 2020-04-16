import * as _ from 'lodash';
import * as Immutable from 'immutable';
import { JSONSchema6 } from 'json-schema';
import { SpecCapability, Descriptor } from '../descriptors/types';
import { modelFor, definitionFor } from '@console/internal/module/k8s';
import { capabilityFieldMap, capabilityWidgetMap } from '../descriptors/spec/spec-descriptor-input';
import {
  DEFAULT_K8S_SCHEMA,
  HIDDEN_UI_SCHEMA,
  K8S_RESOURCE_SUFFIX_MATCH_PATTERN,
  SELECT_OPTION_MATCH_PATTERN,
} from './const';
import { UiSchema } from 'react-jsonschema-form';
import { SchemaType } from '@console/shared/src/components/dynamic-form';
import { getSchemaType } from 'react-jsonschema-form/lib/utils';

// Transform a path string from a descriptor to a JSON schema path array
export const descriptorPathToUISchemaPath = (path: string): string[] =>
  (_.toPath(path) || []).map((subPath) => {
    return /^\d+$/.test(subPath) ? 'items' : subPath;
  });

// Determine if a given path is defined on a JSONSchema
export const jsonSchemaHas = (jsonSchema: JSONSchema6, schemaPath: string[]): boolean => {
  const [next, ...rest] = schemaPath;
  const nextSchema = jsonSchema?.[next] || jsonSchema?.properties?.[next];
  if (rest.length && !!nextSchema) {
    return jsonSchemaHas(nextSchema, rest);
  }
  return !!nextSchema;
};

// Gets a JSONSchema from the CRD or stored swagger definition with some default types defined.
export const getJSONSchema = (crd, model) => {
  const baseSchema =
    crd?.spec?.validation?.openAPIV3Schema || (definitionFor(model) as JSONSchema6);
  return _.defaultsDeep({}, DEFAULT_K8S_SCHEMA, _.omit(baseSchema, 'properties.status'));
};

// Applies a hidden widget and label configuration to every property of the given schema.
// This is useful for whitelisting only a few schema properties when all properties are not known.
export const hideAllExistingProperties = (schema: JSONSchema6) => {
  return _.reduce(
    schema?.properties,
    (acc, _unused, propertyName) => ({
      ...acc,
      [propertyName]: HIDDEN_UI_SCHEMA,
    }),
    {},
  );
};

// Map common json schem property names to default widgets or fields
export const getDefaultUISchemaForPropertyName = (name) =>
  ({
    resources: { 'ui:field': 'ResourceRequirementsField', 'ui:title': 'Resource Requirements' },
    installPlan: { 'ui:field': 'InstallPlanField', 'ui:title': 'Install Plan' },
    imagePullPolicy: { 'ui:widget': 'ImagePullPolicyWidget', 'ui:title': 'Image Pull Policy' },
    updateStrategy: { 'ui:field': 'UpdateStrategyField', 'ui:title': 'Update Strategy' },
    nodeAffinity: { 'ui:field': 'NodeAffinityField', 'ui:title': 'Node Affinity' },
    podAffinity: { 'ui:field': 'PodAffinityField', 'ui:title': 'Pod Affinity' },
    podAntiAffinity: { 'ui:field': 'PodAffinityField', 'ui:title': 'Pod Anti-Affinity' },
    replicas: { 'ui:widget': 'PodCountWidget', 'ui:title': 'Replicas' },
    matchExpressions: { 'ui:field': 'MatchExpressionsField', 'ui:title': 'Match Expressions' },
  }?.[name] || {});

// Determine if a schema will produce an empty form field.
export const hasNoFields = (jsonSchema: JSONSchema6): boolean => {
  const type = getSchemaType(jsonSchema || {});
  const handleArray = () => {
    return hasNoFields(jsonSchema.items as JSONSchema6);
  };
  const handleObject = () => {
    return (
      _.every(jsonSchema?.properties, hasNoFields) &&
      _.every(jsonSchema?.additionalProperties as JSONSchema6, hasNoFields)
    );
  };

  switch (type) {
    case SchemaType.array:
      return handleArray();
    case SchemaType.object:
      return handleObject();
    default:
      return false;
  }
};

// Map json schema to default ui schema
export const getDefaultUISchema = (jsonSchema: JSONSchema6): UiSchema => {
  const type = getSchemaType(jsonSchema || {});
  if (hasNoFields(jsonSchema)) {
    return HIDDEN_UI_SCHEMA;
  }

  const handleArray = () => {
    const descendatnUISchema = getDefaultUISchema(jsonSchema.items as JSONSchema6);
    return !_.isEmpty(descendatnUISchema) ? { items: descendatnUISchema } : {};
  };

  const handleObject = () => {
    return _.reduce(
      jsonSchema.properties,
      (uiSchemaAccumulator: UiSchema, property: JSONSchema6, name: string) => {
        const defaultSchema = getDefaultUISchemaForPropertyName(name);
        const schemaForProperty = {
          ...defaultSchema,
          ...getDefaultUISchema(property),
        };
        if (_.isEmpty(schemaForProperty)) {
          return uiSchemaAccumulator;
        }

        return {
          ...(uiSchemaAccumulator || {}),
          [name]: schemaForProperty,
        };
      },
      {},
    );
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

// Given an array of SpecCapabilities, return the appropriate corresponding UISchema
export const capabilitiesToUISchema = (capabilities: SpecCapability[] = []) => {
  if (!capabilities?.length) {
    return {};
  }

  const k8SResourceCapability = _.find(capabilities, (capability) => {
    return capability.startsWith(SpecCapability.k8sResourcePrefix);
  });

  if (k8SResourceCapability) {
    const [, groupVersionKind] =
      k8SResourceCapability.match(K8S_RESOURCE_SUFFIX_MATCH_PATTERN) || [];
    const model = groupVersionKind && modelFor(groupVersionKind);
    if (model) {
      return {
        'ui:widget': 'K8sResourceWidget',
        'ui:options': { model, groupVersionKind },
      };
    }
  }

  const enumOptions = _.reduce(
    capabilities,
    (optionAccumulator, capability) => {
      const [, option] = capability.match(SELECT_OPTION_MATCH_PATTERN) || [];
      return option ? optionAccumulator.add({ label: option, value: option }) : optionAccumulator;
    },
    Immutable.Set(),
  ).toJS();

  if (enumOptions.length) {
    return {
      'ui:field': 'SelectField',
      'ui:options': { enumOptions },
    };
  }

  const field = _.reduce(
    capabilities,
    (fieldAccumulator, capability) => {
      return fieldAccumulator || capabilityFieldMap.get(capability);
    },
    undefined,
  );

  const widget = _.reduce(
    capabilities,
    (widgetAccumulator, capability) => {
      return widgetAccumulator || capabilityWidgetMap.get(capability);
    },
    undefined,
  );

  return {
    ...(field && { 'ui:field': field }),
    ...(widget && { 'ui:widget': widget }),
  };
};

// Given a JSONSchema and associated uiSchema, create the appropriat ui schema order property for the jsonSchema.
// Orders properties according to the following rules:
//  - required properties with an associated ui schema come first,
//  - required properties without an associated ui schema next,
//  - optional fields with an associated ui schema next,
//  - all other properties
export const getJSONSchemaOrder = (jsonSchema, uiSchema) => {
  const type = getSchemaType(jsonSchema || {});
  const handleArray = () => {
    const descendantOrder = getJSONSchemaOrder(jsonSchema?.items as JSONSchema6, uiSchema?.items);
    return !_.isEmpty(descendantOrder) ? { items: descendantOrder } : {};
  };

  const handleObject = () => {
    const propertyNames = _.keys(jsonSchema?.properties || {});
    if (_.isEmpty(propertyNames)) {
      return {};
    }
    const describedProperties = _.filter(propertyNames, (propertyName) => uiSchema?.[propertyName]);
    const required = jsonSchema?.required || [];
    const requiredAndDescribed = _.intersection(required, describedProperties);
    const requiredNotDescribed = _.difference(required, requiredAndDescribed);
    const optionalAndDescribed = _.difference(describedProperties, requiredAndDescribed);
    const order = [...requiredAndDescribed, ...requiredNotDescribed, ...optionalAndDescribed, '*'];
    return {
      ...(order.length > 1 && { 'ui:order': order }),
      ..._.reduce(
        jsonSchema?.properties || {},
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

// Map a set of spec descriptors to a ui schema
export const descriptorsToUISchema = (
  descriptors: Descriptor<SpecCapability>[],
  jsonSchema: JSONSchema6,
) => {
  const uiSchemaFromDescriptors = _.reduce(
    descriptors,
    (
      uiSchemaAccumulator,
      { path, description, displayName, 'x-descriptors': capabilities = [] },
    ) => {
      const schemaPath = descriptorPathToUISchemaPath(path);
      if (!jsonSchemaHas(jsonSchema, schemaPath)) {
        // eslint-disable-next-line no-console
        console.warn('SpecDescriptor path references a non-existent schema property:', path);
        return uiSchemaAccumulator;
      }
      const isAdvanced = _.includes(capabilities, SpecCapability.advanced);
      const capabilitiesUISchema = capabilitiesToUISchema(
        _.without(capabilities, SpecCapability.advanced),
      );
      return uiSchemaAccumulator.withMutations((mutable) => {
        if (isAdvanced) {
          const advancedPropertyName = _.last(schemaPath);
          const pathToAdvanced = [...schemaPath.slice(0, schemaPath.length - 1), 'ui:advanced'];
          const currentAdvanced = mutable.getIn(pathToAdvanced) || Immutable.List();
          mutable.setIn(pathToAdvanced, currentAdvanced.push(advancedPropertyName));
        }
        mutable.setIn(
          schemaPath,
          Immutable.Map({
            ...(description && { 'ui:description': description }),
            ...(displayName && { 'ui:title': displayName }),
            ...capabilitiesUISchema,
          }),
        );
      });
    },
    Immutable.Map(),
  ).toJS();
  return _.merge(uiSchemaFromDescriptors, getJSONSchemaOrder(jsonSchema, uiSchemaFromDescriptors));
};

// Use jsonSchema, descriptors, and some defaults to generate a uiSchema
export const getUISchema = (jsonSchema, providedAPI) => {
  return _.defaultsDeep({}, getDefaultUISchema(jsonSchema), {
    metadata: {
      ...hideAllExistingProperties(jsonSchema?.properties?.metadata as JSONSchema6),
      name: {
        'ui:widget': 'TextWidget',
      },
      labels: {
        'ui:field': 'LabelsField',
      },
      'ui:options': {
        label: false,
      },
      'ui:order': ['name', 'labels', '*'],
    },
    spec: {
      ...descriptorsToUISchema(providedAPI?.specDescriptors, jsonSchema?.properties?.spec),
      'ui:options': {
        label: false,
      },
    },
    'ui:order': ['metadata', 'spec', '*'],
  });
};
