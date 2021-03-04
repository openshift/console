import * as React from 'react';
import BeforeUnloadWatchResContext from './BeforeUnloadWatchResContext';
import { usePreventUnloadForResource } from './usePreventUnloadForResource';

const BeforeUnloadWatchResProvider: React.FC = ({ children }) => {
  const watchResource = usePreventUnloadForResource();

  return (
    <BeforeUnloadWatchResContext.Provider value={{ watchResource }}>
      {children}
    </BeforeUnloadWatchResContext.Provider>
  );
};

export default BeforeUnloadWatchResProvider;
