import * as React from 'react';
/* eslint-disable-next-line import/named */
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { useActiveNamespace } from '@console/shared/src';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

const appendActiveNamespace = (namespace: string, pathname: string): string => {
  const basePath = pathname.replace(/\/$/, '');
  return namespace === ALL_NAMESPACES_KEY
    ? `${basePath}/all-namespaces`
    : `${basePath}/ns/${namespace}`;
};

export type NamespaceRedirectProps = RouteComponentProps;

export const NamespaceRedirect: React.FC<NamespaceRedirectProps> = ({ location: { pathname } }) => {
  const [activeNamespace] = useActiveNamespace();
  return <Redirect to={appendActiveNamespace(activeNamespace, pathname) + location.search} />;
};
