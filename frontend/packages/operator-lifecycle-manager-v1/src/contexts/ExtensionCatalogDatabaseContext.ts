import { createContext } from 'react';
import { ExtensionCatalogDatabaseContextValues } from './types';

export const ExtensionCatalogDatabaseContext = createContext<ExtensionCatalogDatabaseContextValues>(
  { done: false, error: null },
);

export default ExtensionCatalogDatabaseContext.Provider;
