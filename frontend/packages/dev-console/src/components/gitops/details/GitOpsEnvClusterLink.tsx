import * as React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, LoadingInline } from '@console/internal/components/utils';

interface GitOpsEnvClusterLinkProps {
  url: string;
  consoleURL: any[];
  path?: string;
  children?: React.ReactNode;
  className: string;
}

const GitOpsEnvClusterLink: React.FC<GitOpsEnvClusterLinkProps> = ({
  url,
  consoleURL,
  path,
  children,
  className,
}) => {
  const [currentClusterURL, loaded, loadError] = consoleURL;

  if (!loaded && !loadError) return <LoadingInline />;

  return currentClusterURL === url ? (
    <Link to={path} className={className}>
      {children}
    </Link>
  ) : (
    <ExternalLink
      additionalClassName={className}
      href={path ? `${url}${path}` : url}
      text={children}
    />
  );
};

export default GitOpsEnvClusterLink;
