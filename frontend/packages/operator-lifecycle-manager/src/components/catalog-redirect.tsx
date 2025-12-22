import { Navigate } from 'react-router-dom-v5-compat';

const CatalogRedirect: React.FCC = () => <Navigate to={`/catalog?catalogType=operator`} replace />;

export default CatalogRedirect;
