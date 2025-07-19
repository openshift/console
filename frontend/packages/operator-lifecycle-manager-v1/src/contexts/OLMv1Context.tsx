import * as React from 'react';
import { useOLMv1Catalogs, useOLMv1Status, useOLMv1AutoRefresh } from '../hooks/useOLMv1API';

interface OLMv1BackendContextType {
  // Catalog state
  catalogs: any[];
  catalogsLoaded: boolean;
  catalogsError: Error | null;

  // Backend status
  status: any;
  statusLoaded: boolean;
  statusError: Error | null;

  // Control functions
  refreshCatalogs: () => void;
  refreshStatus: () => void;
}

const OLMv1BackendContext = React.createContext<OLMv1BackendContextType | null>(null);

export const useOLMv1Backend = (): OLMv1BackendContextType => {
  const context = React.useContext(OLMv1BackendContext);
  if (!context) {
    throw new Error('useOLMv1Backend must be used within an OLMv1BackendProvider');
  }
  return context;
};

interface OLMv1BackendProviderProps {
  children: React.ReactNode;
}

export const OLMv1BackendProvider: React.FC<OLMv1BackendProviderProps> = ({ children }) => {
  // Use our new backend API hooks
  const {
    catalogs,
    loaded: catalogsLoaded,
    error: catalogsError,
    refetch: refetchCatalogs,
  } = useOLMv1Catalogs();

  const {
    status,
    loaded: statusLoaded,
    error: statusError,
    refetch: refetchStatus,
  } = useOLMv1Status();

  // Auto-refresh when ClusterCatalog resources change
  useOLMv1AutoRefresh(() => {
    refetchCatalogs();
    refetchStatus();
  });

  const contextValue: OLMv1BackendContextType = {
    catalogs,
    catalogsLoaded,
    catalogsError,
    status,
    statusLoaded,
    statusError,
    refreshCatalogs: refetchCatalogs,
    refreshStatus: refetchStatus,
  };

  return (
    <OLMv1BackendContext.Provider value={contextValue}>{children}</OLMv1BackendContext.Provider>
  );
};
