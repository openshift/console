import * as _ from 'lodash';
import { Extension } from '../types';

/**
 * Recursively merges the given object into extension's properties.
 */
export const mergeExtensionProperties = <E extends Extension>(e: E, properties: {}): E =>
  Object.freeze({
    ...e,
    properties: _.merge({}, e.properties, properties),
  });
