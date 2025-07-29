import * as React from 'react';
import { Bullseye } from '@patternfly/react-core';
import { LoadingBox } from '@console/internal/components/utils';
import { useOLMv1Backend, OLMv1BackendProvider } from '../contexts/OLMv1Context';
import { useExtensionCatalogItems } from '../hooks/useExtensionCatalogItems';

const ExtensionCatalogInner: React.FC = () => {
  const { catalogs, catalogsLoaded, catalogsError, status, statusLoaded } = useOLMv1Backend();
  const { items, loaded: itemsLoaded, error: itemsError } = useExtensionCatalogItems();

  // Show loading state
  if (!catalogsLoaded || !statusLoaded || !itemsLoaded) {
    return (
      <Bullseye>
        <LoadingBox />
      </Bullseye>
    );
  }

  // Show error state
  if (catalogsError || itemsError) {
    return (
      <div>
        <h3>Error loading catalog data</h3>
        {catalogsError && <p>Catalogs error: {catalogsError.message}</p>}
        {itemsError && <p>Items error: {itemsError.message}</p>}
      </div>
    );
  }

  return (
    <div>
      <h2>Extension Catalog (Backend-powered)</h2>

      {/* Status information */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h4>Backend Status</h4>
        <p>Available catalogs: {catalogs?.length || 0}</p>
        <p>Available items: {items?.length || 0}</p>
        {status && (
          <details>
            <summary>Detailed Status</summary>
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </details>
        )}
      </div>

      {/* Catalog summary */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Catalogs</h4>
        {catalogs.map((catalog) => (
          <div
            key={catalog.catalogName}
            style={{ margin: '10px 0', padding: '10px', border: '1px solid #ddd' }}
          >
            <strong>{catalog.catalogName}</strong>
            <p>Objects: {catalog.objectCount}</p>
            <p>Last Updated: {catalog.lastUpdated}</p>
            <p>Base URL: {catalog.baseURL}</p>
          </div>
        ))}
      </div>

      {/* Package items */}
      <div>
        <h4>Available Packages</h4>
        {items.length === 0 ? (
          <p>No packages available</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '15px',
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <h5>{item.displayName || item.name}</h5>
                <p>{item.description}</p>
                <small>Catalog: {item.catalog}</small>
                <br />
                <small>Package: {item.package}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ExtensionCatalog: React.FC = () => {
  return (
    <OLMv1BackendProvider>
      <ExtensionCatalogInner />
    </OLMv1BackendProvider>
  );
};
