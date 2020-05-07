import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { RootState } from '../../redux-types';

const appendActiveNamespace = (namespace: string, pathname: string): string => {
  const basePath = pathname.replace(/\/$/, '');
  return namespace === ALL_NAMESPACES_KEY
    ? `${basePath}/all-namespaces`
    : `${basePath}/ns/${namespace}`;
};

interface StateProps {
  activeNamespace: string;
}

export type NamespaceRedirectProps = StateProps & RouteComponentProps;

const NamespaceRedirect_: React.FC<NamespaceRedirectProps> = ({
  activeNamespace,
  location: { pathname },
}) => <Redirect to={appendActiveNamespace(activeNamespace, pathname) + location.search} />;

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export const NamespaceRedirect = connect(mapStateToProps)(NamespaceRedirect_);
