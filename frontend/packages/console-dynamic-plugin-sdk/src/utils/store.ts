import { Extension } from '../types';

export const mergeExtensionProperties = <E extends Extension>(e: E, properties: {}): E =>
  Object.freeze({
    ...e,
    properties: Object.assign({}, e.properties, properties),
  });
