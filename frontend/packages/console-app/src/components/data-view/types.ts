/* eslint-disable no-barrel-files/no-barrel-files */
// Re-export types from internal-types to maintain backward compatibility
export type {
  ResourceFilters,
  ResourceMetadata,
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
