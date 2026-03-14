import type { FC } from 'react';
import { Navigate } from 'react-router';

const CatalogRedirect: FC = () => <Navigate to={`/catalog?catalogType=operator`} replace />;

export default CatalogRedirect;
