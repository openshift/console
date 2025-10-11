import * as React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom-v5-compat';

// Redirect all-namespaces catalog to default namespace
// TODO: Make Software Catalog work with all namespaces. https://issues.redhat.com/browse/CONSOLE-4827
const CatalogDefaultNamespaceRedirect: React.FCC = () => {
  const [params] = useSearchParams();
  return <Navigate to={`/catalog/ns/default?${params.toString()}`} replace />;
};

export default CatalogDefaultNamespaceRedirect;
