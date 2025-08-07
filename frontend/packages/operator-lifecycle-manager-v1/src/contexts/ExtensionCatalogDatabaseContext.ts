import * as React from 'react';
import { ExtensionCatalogDatabaseContextValues } from './types';

export const ExtensionCatalogDatabaseContext = React.createContext<
  ExtensionCatalogDatabaseContextValues
>({ done: false, error: null as any });

export default ExtensionCatalogDatabaseContext.Provider;
