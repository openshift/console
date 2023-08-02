import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom-v5-compat';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

const appendActiveNamespace = (namespace: string, pathname: string): string => {
  const basePath = pathname.replace(/\/$/, '');
  return namespace === ALL_NAMESPACES_KEY
    ? `${basePath}/all-namespaces`
    : `${basePath}/ns/${namespace}`;
};

export const NamespaceRedirect: React.FC = () => {
  const location = useLocation();
  const [activeNamespace] = useActiveNamespace();
  return (
    <Navigate
      to={appendActiveNamespace(activeNamespace, location.pathname) + location.search}
      replace
    />
  );
};
