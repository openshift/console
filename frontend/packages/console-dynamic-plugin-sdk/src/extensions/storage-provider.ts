import { RouteComponentProps } from 'react-router';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type StorageProvider = ExtensionDeclaration<
  'console.storage-provider',
  {
    name: string;
    Component: CodeRef<React.ComponentType<Partial<RouteComponentProps>>>;
  }
>;

export const isStorageProvider = (e: Extension): e is StorageProvider =>
  e.type === 'console.storage-provider';
