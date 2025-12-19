import { Navigate, useSearchParams } from 'react-router-dom-v5-compat';

// Redirect catalog to default namespace
const CatalogDefaultNamespaceRedirect: React.FCC = () => {
  const [params] = useSearchParams();
  return <Navigate to={`/catalog/ns/default?${params.toString()}`} replace />;
};

export default CatalogDefaultNamespaceRedirect;
