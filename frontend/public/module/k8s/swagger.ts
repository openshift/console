import * as _ from 'lodash-es';

import { STORAGE_PREFIX } from '@console/shared/src/constants';
import { coFetchJSON } from '../../co-fetch';
import { K8sKind, referenceForModel } from './';

const SWAGGER_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/swagger-definitions`;

export const getDefinitionKey = _.memoize(
  (model: K8sKind, definitions: SwaggerDefinitions): string => {
    return _.findKey(definitions, (def: SwaggerDefinition) => {
      return _.some(def['x-kubernetes-group-version-kind'], ({ group, version, kind }) => {
        return (
          (model.apiGroup || '') === (group || '') &&
          model.apiVersion === version &&
          model.kind === kind
        );
      });
    });
  },
  referenceForModel,
);

// Cache parsed swagger to avoid reparsing the JSON each call.
let swagger: SwaggerDefinitions;
export const getStoredSwagger = (): SwaggerDefinitions => {
  if (swagger) {
    return swagger;
  }
  const json = window.localStorage.getItem(SWAGGER_LOCAL_STORAGE_KEY);
  if (!json) {
    return null;
  }
  try {
    swagger = JSON.parse(json);
    return swagger;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not parse swagger JSON.', e);
    return null;
  }
};

const storeSwagger = (definitions: SwaggerDefinitions) => {
  // Only store definitions to reduce the document size.
  const json = JSON.stringify(definitions);
  window.localStorage.setItem(SWAGGER_LOCAL_STORAGE_KEY, json);
  swagger = definitions;
};

export const fetchSwagger = async (): Promise<SwaggerDefinitions> => {
  try {
    const response: SwaggerAPISpec = await coFetchJSON('api/kubernetes/openapi/v2');
    if (!response.definitions) {
      // eslint-disable-next-line no-console
      console.error('Definitions missing in OpenAPI response.');
      return null;
    }
    storeSwagger(response.definitions);
    return response.definitions;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not get OpenAPI definitions', e);
    return null;
  }
};

export const definitionFor = _.memoize((model: K8sKind): SwaggerDefinition => {
  const allDefinitions: SwaggerDefinitions = getStoredSwagger();
  if (!allDefinitions) {
    return null;
  }
  const key = getDefinitionKey(model, allDefinitions);
  return _.get(allDefinitions, key);
}, referenceForModel);

const getRef = (definition: SwaggerDefinition): string => {
  const ref = definition.$ref || _.get(definition, 'items.$ref');
  const re = /^#\/definitions\//;
  // Only follow JSON pointers, not external URI references.
  return ref && re.test(ref) ? ref.replace(re, '') : null;
};

// Get the path in the swagger document to additional property details.
// This can be
// - A reference to another top-level definition
// - Inline property declartions
// - Inline property declartions for array items
export const getSwaggerPath = (
  allProperties: SwaggerDefinitions,
  currentPath: string[],
  name: string,
  followRef: boolean,
): string[] => {
  const nextPath = [...currentPath, 'properties', name];
  const definition = _.get(allProperties, nextPath) as SwaggerDefinition;
  if (!definition) {
    return null;
  }
  const ref = getRef(definition);
  return followRef && ref ? [ref] : nextPath;
};

const findDefinition = (kindObj: K8sKind, propertyPath: string[]): SwaggerDefinition => {
  const allDefinitions: SwaggerDefinitions = getStoredSwagger();
  if (!allDefinitions) {
    return null;
  }

  const rootPath = getDefinitionKey(kindObj, allDefinitions);
  const path = propertyPath.reduce(
    (currentPath: string[], nextProperty: string, i: number): string[] => {
      if (!currentPath) {
        return null;
      }
      // Don't follow the last reference since the description is not as good.
      const followRef = i !== propertyPath.length - 1;
      return getSwaggerPath(allDefinitions, currentPath, nextProperty, followRef);
    },
    [rootPath],
  );

  return path ? (_.get(allDefinitions, path) as SwaggerDefinition) : null;
};

export const getPropertyDescription = (
  kindObj: K8sKind,
  propertyPath: string | string[],
): string => {
  const path: string[] = _.toPath(propertyPath);
  const definition = findDefinition(kindObj, path);
  return definition ? definition.description : null;
};

export const getResourceDescription = _.memoize((kindObj: K8sKind): string => {
  const allDefinitions: SwaggerDefinitions = getStoredSwagger();
  if (!allDefinitions) {
    return null;
  }
  const key = getDefinitionKey(kindObj, allDefinitions);
  return _.get(allDefinitions, [key, 'description']);
}, referenceForModel);

export type SwaggerDefinition = {
  description?: string;
  type?: string;
  enum?: string[];
  $ref?: string;
  items?: SwaggerDefinition;
  required?: string[];
  properties?: {
    [prop: string]: SwaggerDefinition;
  };
};

export type SwaggerDefinitions = {
  [name: string]: SwaggerDefinition;
};

export type SwaggerAPISpec = {
  swagger: string;
  info: { title: string; version: string };
  paths: { [path: string]: any };
  definitions: SwaggerDefinitions;
};
