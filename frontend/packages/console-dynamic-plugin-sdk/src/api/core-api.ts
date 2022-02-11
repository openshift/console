/* eslint-disable */
import { UseActivePerspective } from '../extensions/console-types';

export const useActivePerspective: UseActivePerspective = require('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective')
  .default;

export * from '../perspective/perspective-context';

// Dynamic plugin SDK core APIs
export * from './dynamic-core-api';
