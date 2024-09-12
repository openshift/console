import * as React from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';

type LogURLRedirectProps = RouteComponentProps<{ ns: string; taskName: string; plrName: string }>;

const createLogURL = (pathname: string, taskName: string): string => {
  const basePath = pathname.replace(/\/$/, '');
  const detailsURL = basePath.split('/logs/');
  return `${detailsURL[0]}/logs?taskName=${taskName}`;
};

export const LogURLRedirect: React.FC<LogURLRedirectProps> = ({ match }) => {
  const { taskName } = match.params;
  return <Redirect to={createLogURL(window.location.pathname, taskName)} />;
};
