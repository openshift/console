import type { FC } from 'react';
import { Navigate, useLocation } from 'react-router';
import { CatalogQueryParams } from '@console/shared/src/components/catalog/utils/types';
import { OPERATOR_OLMV0_TYPE } from '../const';

/**
 * Serves the legacy `/operatorhub` and un-namespaced `/catalog` URLs, both of which predate the
 * Software Catalog's namespaced routes. An explicit catalog type is preserved so that
 * `/catalog?catalogType=<type>` links keep working; otherwise we land on Classic (OLMv0), which
 * is what both URLs used to show.
 */
const CatalogRedirect: FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  if (!searchParams.get(CatalogQueryParams.TYPE)) {
    searchParams.set(CatalogQueryParams.TYPE, OPERATOR_OLMV0_TYPE);
  }

  return <Navigate to={`/catalog/all-namespaces?${searchParams.toString()}`} replace />;
};

export default CatalogRedirect;
