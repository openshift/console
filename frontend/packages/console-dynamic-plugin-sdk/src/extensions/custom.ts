import type { Extension } from '../types';

/**
 * Custom Console extension with arbitrary `type` and `properties`.
 *
 * This is a special type representing all non-standard Console extension declarations.
 *
 * This allows dynamic plugins to consume extensions which are specific to other plugins.
 */
export type CustomExtension = Extension<string, { [key: string]: any }>;
