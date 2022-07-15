import { Extension, ExtensionDeclaration } from '../types';

/**
 * Repackage core SDK extensions as console extensions.
 */
export type RepackageExtension<T extends string, E extends Extension> = ExtensionDeclaration<
  T,
  E['properties']
>;
