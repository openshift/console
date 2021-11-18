/* eslint-disable */
import {
  UseActivePerspective,
} from '../extensions/console-types';

export const useActivePerspective: UseActivePerspective = require('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective')
  .default;

  // Dynamic plugin SDK core APIs
export * from './dynamic-core-api';
