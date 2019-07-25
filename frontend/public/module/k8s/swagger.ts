import * as _ from 'lodash-es';

import { STORAGE_PREFIX } from '../../const';
import { coFetchJSON } from '../../co-fetch';
import { K8sKind, referenceForModel, SwaggerDefinitions } from './';

const SWAGGER_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/swagger-definitions`;

export const getDefinitionKey = _.memoize((model: K8sKind, definitions: SwaggerDefinitions): string => {
  return _.findKey(definitions, (def: SwaggerDefinition) => {
    return _.some(def['x-kubernetes-group-version-kind'], ({group, version, kind}) => {
      return (model.apiGroup || '') === (group || '') &&
        model.apiVersion === version &&
        model.kind === kind;
    });
  });
}, referenceForModel);

export const getStoredSwagger = (): SwaggerDefinitions => {
  const json = window.localStorage.getItem(SWAGGER_LOCAL_STORAGE_KEY);
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not parse swagger JSON.', e);
    return null;
  }
};

const storeSwagger = (swagger: SwaggerAPISpec) => {
  // Only store definitions to reduce the document size.
  const json = JSON.stringify(swagger.definitions || {});
  window.localStorage.setItem(SWAGGER_LOCAL_STORAGE_KEY, json);
};

export const fetchSwagger = async(): Promise<SwaggerDefinitions> => {
  try {
    const swagger: SwaggerAPISpec = await coFetchJSON('api/kubernetes/openapi/v2');
    storeSwagger(swagger);
    return swagger.definitions;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not get OpenAPI definitions', e);
    return null;
  }
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
  info: {title: string, version: string};
  paths: {[path: string]: any};
  definitions: SwaggerDefinitions;
};
