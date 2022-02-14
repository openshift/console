import { ExtensionDeclaration } from '../types';

/**
 * Custom Console extension with arbitrary `type` and `properties`.
 *
 * This type represents all non-standard Console extension declarations.
 */
export type CustomExtension = ExtensionDeclaration<string, { [key: string]: any }>;
