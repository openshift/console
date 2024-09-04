import * as React from 'react';
import { ExtensionCatalogDatabaseContextValues } from './types';

export const ExtensionCatalogDatabaseContext = React.createContext<
  ExtensionCatalogDatabaseContextValues
>({ done: false, error: null });

export default ExtensionCatalogDatabaseContext.Provider;
