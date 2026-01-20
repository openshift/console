import type { FC } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom-v5-compat';

// Redirect catalog to default namespace
const CatalogDefaultNamespaceRedirect: FC = () => {
  const [params] = useSearchParams();
  return <Navigate to={`/catalog/ns/default?${params.toString()}`} replace />;
};

export default CatalogDefaultNamespaceRedirect;
