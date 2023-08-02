import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** This extension can be used to contribute a new storage provider to select,
    when attaching storage and a provider specific component. */
export type StorageProvider = ExtensionDeclaration<
  'console.storage-provider',
  {
    /** Displayed name of the provider. */
    name: string;
    /** Provider specific component to render. */
    Component: CodeRef<React.ComponentType>;
  }
>;

export const isStorageProvider = (e: Extension): e is StorageProvider =>
  e.type === 'console.storage-provider';
