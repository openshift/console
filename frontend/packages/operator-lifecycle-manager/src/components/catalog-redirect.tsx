import type { FC } from 'react';
import { Navigate, useLocation } from 'react-router';

const CatalogRedirect: FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  searchParams.set('catalogType', 'operator');

  return <Navigate to={`/catalog/all-namespaces?${searchParams.toString()}`} replace />;
};

export default CatalogRedirect;
