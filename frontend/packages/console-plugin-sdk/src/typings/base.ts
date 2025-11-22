import type { Extension } from '@console/dynamic-plugin-sdk/src/types';

/**
 * From Console application perspective, a plugin is a list of extensions
 * enhanced with additional data.
 */
export type ActivePlugin = {
  name: string;
  extensions: Extension[];
};
