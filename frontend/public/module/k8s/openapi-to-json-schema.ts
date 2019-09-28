// contains all the relevant information for transforming openapi specifications (such as kuberneres openapi)
// to json schemas

interface GroupVersionKind {
  kind: string;
  version: string;
  group: string;
}

/**
 * Given an array of GroupVersionKind objects, return their JSON Schema representation as enums
 */
function groupVersionKindToEnums(gvkObjArray: [GroupVersionKind]) {
  const versionEnum = [];
  const kindEnum = [];
  for (const gvkObj of gvkObjArray) {
    if (gvkObj.group && gvkObj.version) {
      versionEnum.push(`${gvkObj.group}/${gvkObj.version}`);
    } else if (gvkObj.version) {
      versionEnum.push(gvkObj.version);
    }
    if (gvkObj.kind) {
      kindEnum.push(gvkObj.kind);
    }
  }
  return {
    versionEnum,
    kindEnum,
  };
}

/**
 * Append enums to APIVersion or create the object if it doesn't exist
 */
function createOrAppendAPIVersion(openAPI, apiVersionEnum: string[]) {
  if (openAPI.apiVersion) {
    if (openAPI.apiVersion.enum) {
      openAPI.apiVersion.enum.push(...apiVersionEnum);
    } else {
      openAPI.apiVersion.enum = apiVersionEnum;
    }
  } else {
    openAPI.apiVersion = {
      enum: apiVersionEnum,
    };
  }
}

/**
 * Append enums to kind or create the object if it doesn't exist
 */
function createOrAppendKind(openAPI, kindEnum: string[]) {
  if (openAPI.kind) {
    if (openAPI.kind.enum) {
      openAPI.kind.enum.push(...kindEnum);
    } else {
      openAPI.kind.enum = kindEnum;
    }
  } else {
    openAPI.kind = {
      enum: kindEnum,
    };
  }
}

/**
 * Converts the openAPI kubernetes specification for group, version, kind to JSON Schema
 *
 * Context: The openAPI specification gives the group, version, and kind objects as 'x-kubernetes-group-version-kind'
 * instead of adding the values to the enum's
 */
function convertGroupVersionKindToJSONSchema(openAPI) {
  for (const definition in openAPI) {
    if (openAPI.hasOwnProperty(definition)) {
      const openAPIDefinition = openAPI[definition];
      const groupVersionKind = openAPIDefinition['x-kubernetes-group-version-kind'];

      // If this object has x-kubernetes-group-version-kind then add their values into correct places in JSON Schema
      if (groupVersionKind && openAPIDefinition.properties) {
        const gvkEnums = groupVersionKindToEnums(groupVersionKind);
        createOrAppendAPIVersion(openAPIDefinition.properties, gvkEnums.versionEnum);
        createOrAppendKind(openAPIDefinition.properties, gvkEnums.kindEnum);
      }
    }
  }
  return openAPI;
}

/**
 * Takes in the stored kubernetes openAPI object and outputs a JSON Schema of the object
 */
export function openAPItoJSONSchema(openAPI) {
  if (!openAPI) {
    return null;
  }

  const convertedOpenAPI = convertGroupVersionKindToJSONSchema(openAPI);

  const oneOfSchemas = [];
  const openAPIDefinitions = {};
  for (const schemaProperty in convertedOpenAPI) {
    if (convertedOpenAPI.hasOwnProperty(schemaProperty)) {
      openAPIDefinitions[schemaProperty] = convertedOpenAPI[schemaProperty];
      oneOfSchemas.push({
        $ref: `#/definitions/${schemaProperty}`,
      });
    }
  }

  return {
    definitions: {
      ...openAPIDefinitions,
    },
    oneOf: oneOfSchemas,
  };
}
